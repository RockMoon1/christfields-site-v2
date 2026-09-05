import { getSupabase, type EventRow, type EventSlotRow, type EventSlotClaimRow, type MemberPrefsRow } from '@/lib/supabase';
import { whenInWords } from '@/lib/dashboard/format';
import { noteLines } from '@/lib/dashboard/prompts';
import { dayKeyInZone } from '@/lib/dashboard/timezone';
import { appUrl } from '@/lib/dashboard/prefs';
import { groupThemes } from '@/lib/dashboard/quiet-themes';
import { lastSeenByMember, notSeenLately, nudgeDue } from '@/lib/dashboard/rhythm';
import { eventMail, leaderBriefMail } from './templates';
import { dedupeKey, localHour, orderByAnswer, WINDOWS, PUSH_PRUNE_DAYS } from './rules';
import { loadEventContext, runPush, runEmail, answerOf, memberTz, emailOn, linksFor, whenFor } from './fanout';

/**
 * What the hourly tick does. Every task is idempotent through the dedupe
 * ledger, computes from live event state at send time, and respects a wall
 * clock deadline so two Netlify invocations always fit inside the 30s limit.
 *
 * Reminder keys carry the event's local start day (or hour), so a leader
 * moving an event to another day opens a fresh reminder slot while a
 * same-day tick still hits the same key.
 */

const DAY = 86_400_000;

export interface TickReport {
  reminders24h: number;
  reminders2h: number;
  briefs: number;
  leaderStarts: number;
  feedsRefreshed: number;
  googleSynced: number;
  rhythm: number;
  pruned: Record<string, number>;
  remaining: boolean;
  ms: number;
}

async function scheduledBetween(fromMs: number, toMs: number): Promise<EventRow[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from('events')
    .select('*')
    .eq('status', 'scheduled')
    .gte('starts_at', new Date(fromMs).toISOString())
    .lt('starts_at', new Date(toMs).toISOString())
    .order('starts_at', { ascending: true })
    .limit(50);
  return (data as EventRow[] | null) ?? [];
}

function startDay(e: EventRow): string {
  return dayKeyInZone(e.tz, new Date(e.starts_at));
}

/* ------------------------------------------------------------ the day before */

export async function remind24h(nowMs: number, deadline: () => boolean): Promise<number> {
  const events = await scheduledBetween(nowMs + WINDOWS.reminder_24h.fromMs, nowMs + WINDOWS.reminder_24h.toMs);
  let did = 0;
  for (const e of events) {
    if (deadline()) break;
    const ctx = await loadEventContext(e.id, nowMs);
    if (!ctx) continue;
    const key = dedupeKey(e.id, 'reminder_24h', startDay(e));
    const series = !!e.series_id;
    // Series: only people who said in or not sure. One-offs: everyone who has not declined.
    const audience = ctx.members.filter((m) => {
      const a = answerOf(ctx, m.userId);
      return series ? a === 'going' || a === 'maybe' : a !== 'not_going';
    });
    const push = await runPush(ctx, {
      key,
      recipients: audience,
      message: (tz) => ({
        title: `Tomorrow: ${e.title}`,
        body: `${whenInWords(e.starts_at, tz, nowMs)}${e.location ? ` at ${e.location}` : ''}`,
        url: `/dashboard/e/${e.id}`,
        tag: `event-${e.id}`,
      }),
      urgency: 'normal',
      ttlSeconds: 20 * 3600,
      loud: false,
      ceiling: true,
      retryable: true,
    });
    const email = await runEmail(ctx, {
      key,
      tier: 'reminder',
      recipients: orderByAnswer(
        audience.filter((m) => emailOn(ctx, m.userId)),
        (m) => answerOf(ctx, m.userId),
      ),
      build: (m) =>
        eventMail({
          kind: 'reminder_24h',
          event: ctx.member,
          whenText: whenFor(ctx, m.userId),
          firstName: m.firstName,
          myAnswer: answerOf(ctx, m.userId),
          starters: noteLines(e.member_note, 2),
          links: linksFor(ctx, m.userId),
        }),
      retryable: true,
    });
    if (push.pushed + email.emailed > 0) did += 1;
  }
  return did;
}

/* ------------------------------------------------------------ two hours before */

export async function remind2h(nowMs: number, deadline: () => boolean): Promise<number> {
  const events = await scheduledBetween(nowMs + WINDOWS.reminder_2h.fromMs, nowMs + WINDOWS.reminder_2h.toMs);
  let did = 0;
  for (const e of events) {
    if (deadline()) break;
    const ctx = await loadEventContext(e.id, nowMs);
    if (!ctx) continue;
    const going = ctx.members.filter((m) => answerOf(ctx, m.userId) === 'going');
    if (going.length === 0) continue;
    const starter = noteLines(e.member_note, 1)[0] ?? '';
    const startMs = Date.parse(e.starts_at);
    const push = await runPush(ctx, {
      key: dedupeKey(e.id, 'reminder_2h', `${startDay(e)}T${localHour(startMs, e.tz)}`),
      recipients: going,
      message: (tz) => ({
        title: `${e.title} at ${whenInWords(e.starts_at, tz, nowMs).split(', ').pop()}`,
        body: starter || `${e.location ? `${e.location}. ` : ''}See you soon.`,
        url: `/dashboard/e/${e.id}`,
        tag: `event-${e.id}`,
      }),
      urgency: 'high',
      ttlSeconds: 2 * 3600,
      loud: false,
      ceiling: true,
      retryable: true,
    });
    if (push.pushed > 0) did += 1;
  }
  return did;
}

/* ------------------------------------------------------------ leader brief at 7am */

export async function leaderBriefs(nowMs: number, deadline: () => boolean): Promise<number> {
  // Anything starting in the next 20 hours might be "today" in its own zone.
  const events = await scheduledBetween(nowMs, nowMs + 20 * 3_600_000);
  let did = 0;
  for (const e of events) {
    if (deadline()) break;
    const today = dayKeyInZone(e.tz, new Date(nowMs)) === startDay(e);
    if (!today || localHour(nowMs, e.tz) < 7) continue;
    const ctx = await loadEventContext(e.id, nowMs);
    if (!ctx) continue;
    const leaders = ctx.members.filter((m) => m.isLeader && emailOn(ctx, m.userId));
    if (leaders.length === 0) continue;

    const sb = ctx.sb;
    const { data: slotRows } = await sb.from('event_slots').select('*').eq('event_id', e.id);
    const slots = (slotRows as EventSlotRow[] | null) ?? [];
    let claims: EventSlotClaimRow[] = [];
    if (slots.length) {
      const { data } = await sb.from('event_slot_claims').select('*').in('slot_id', slots.map((s) => s.id));
      claims = (data as EventSlotClaimRow[] | null) ?? [];
    }
    const gaps = slots
      .map((s) => {
        const taken = claims.filter((c) => c.slot_id === s.id).reduce((n, c) => n + c.qty, 0);
        if (taken >= s.capacity) return '';
        return s.kind === 'ride' ? `${s.capacity - taken} seats open (${s.label})` : `nobody has ${s.label}`;
      })
      .filter(Boolean);

    const name = (m: { firstName: string }) => m.firstName;
    const going = ctx.members.filter((m) => answerOf(ctx, m.userId) === 'going');
    const maybe = ctx.members.filter((m) => answerOf(ctx, m.userId) === 'maybe');
    const silent = ctx.members.filter((m) => answerOf(ctx, m.userId) === 'none');
    const firstTimers = [...going, ...maybe].filter((m) => ctx.rsvps.get(m.userId)?.first_time);
    const [themes, prayersRes] = await Promise.all([
      // Leaders' own reflections must not help clear the three-person bar.
      groupThemes(ctx.members.filter((m) => !m.isLeader).map((m) => m.userId), nowMs),
      sb
        .from('community_prayers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(nowMs - 7 * DAY).toISOString()),
    ]);

    const email = await runEmail(ctx, {
      key: dedupeKey(e.id, 'leader_brief', startDay(e)),
      tier: 'reminder',
      recipients: leaders,
      build: (m) =>
        leaderBriefMail({
          event: ctx.member,
          whenText: whenInWords(e.starts_at, memberTz(ctx, m.userId), nowMs),
          leaderFirstName: m.firstName,
          going: going.map(name),
          maybe: maybe.map(name),
          silent: silent.map(name),
          firstTimers: firstTimers.map(name),
          gaps,
          questions: noteLines(e.leader_note, 3),
          contextNotes: noteLines(e.context_notes || '', 6),
          themes: themes.map((t) => ({ label: t.label, passage: t.passage, nudge: t.nudge })),
          prayersThisWeek: prayersRes.count ?? 0,
          openUrl: `${appUrl()}/dashboard/e/${e.id}`,
        }),
      retryable: true,
    });
    if (email.emailed > 0) did += 1;
  }
  return did;
}

/* ------------------------------------------------------------ the two-week rhythm */

const RHYTHM_HOUR = 17;
const RHYTHM_LOOKBACK_DAYS = 90;

/**
 * Once a day (the 5pm tick, group zone), for each group with something coming
 * up: members not seen in two weeks, not nudged in two weeks, get one push
 * naming the next gathering. Never email, never visible to other members.
 */
export async function rhythmPush(nowMs: number, deadline: () => boolean): Promise<number> {
  if (localHour(nowMs, 'America/Denver') !== RHYTHM_HOUR) return 0;
  const sb = getSupabase();
  const { data: upcomingRows } = await sb
    .from('events')
    .select('id, org_id, title, starts_at, tz')
    .eq('status', 'scheduled')
    .gte('starts_at', new Date(nowMs).toISOString())
    .lte('starts_at', new Date(nowMs + 14 * DAY).toISOString())
    .order('starts_at', { ascending: true })
    .limit(60);
  const nextByOrg = new Map<string, { id: string; org_id: string; title: string; starts_at: string; tz: string }>();
  for (const e of (upcomingRows as { id: string; org_id: string; title: string; starts_at: string; tz: string }[] | null) ?? []) {
    if (!nextByOrg.has(e.org_id)) nextByOrg.set(e.org_id, e);
  }
  let sent = 0;
  // Every group with something coming up, inside the deadline; the dedupe key
  // (org's next event + day) makes a second pass in the same hour a no-op.
  for (const next of nextByOrg.values()) {
    if (deadline()) break;
    const ctx = await loadEventContext(next.id, nowMs);
    if (!ctx || ctx.members.length === 0) continue;
    const since = new Date(nowMs - RHYTHM_LOOKBACK_DAYS * DAY).toISOString();
    const { data: pastEvents } = await sb
      .from('events')
      .select('id, starts_at')
      .eq('org_id', next.org_id)
      .eq('status', 'scheduled')
      .gte('starts_at', since)
      .lte('starts_at', new Date(nowMs).toISOString())
      .limit(200);
    const eventStarts = new Map(((pastEvents as { id: string; starts_at: string }[] | null) ?? []).map((e) => [e.id, e.starts_at]));
    // A group that has not met yet has nobody to miss.
    if (eventStarts.size === 0) continue;
    const ids = [...eventStarts.keys()];
    const [attRes, goingRes] = await Promise.all([
      sb.from('event_attendance').select('clerk_user_id, event_id').in('event_id', ids).eq('present', true),
      sb.from('event_rsvps').select('clerk_user_id, event_id').in('event_id', ids).eq('status', 'going'),
    ]);
    if (attRes.error || goingRes.error) continue; // unknown is not "away"
    const lastSeen = lastSeenByMember({
      attendance: (attRes.data as { clerk_user_id: string; event_id: string }[] | null) ?? [],
      going: (goingRes.data as { clerk_user_id: string; event_id: string }[] | null) ?? [],
      eventStarts,
      nowMs,
    });
    const quiet = new Set(notSeenLately(ctx.members.filter((m) => !m.isLeader), lastSeen, nowMs));
    const recipients = ctx.members.filter((m) => {
      if (!quiet.has(m.userId)) return false;
      if (answerOf(ctx, m.userId) !== 'none') return false; // they already answered the next one, either way
      const prefs: MemberPrefsRow | undefined = ctx.prefs.get(m.userId);
      return nudgeDue(prefs?.rhythm_nudged_at ?? null, nowMs);
    });
    if (recipients.length === 0) continue;
    const res = await runPush(ctx, {
      key: dedupeKey(next.id, 'rhythm', dayKeyInZone(next.tz, new Date(nowMs))),
      recipients,
      message: (tz) => ({
        title: 'It has been a couple of weeks',
        body: `${next.title} is ${whenInWords(next.starts_at, tz, nowMs)}. It would be good to see you.`,
        url: `/dashboard/e/${next.id}`,
        tag: `rhythm-${next.org_id}`,
      }),
      urgency: 'normal',
      ttlSeconds: 20 * 3600,
      loud: false,
      ceiling: true,
      retryable: true,
    });
    if (res.sent.length > 0) {
      // Only the people a device actually reached; everyone else keeps the Home card as their channel.
      const stamp = new Date(nowMs).toISOString();
      await sb
        .from('member_prefs')
        .upsert(
          res.sent.map((userId) => ({ clerk_user_id: userId, rhythm_nudged_at: stamp, updated_at: stamp })),
          { onConflict: 'clerk_user_id' },
        );
      sent += res.sent.length;
    }
  }
  return sent;
}

/* ------------------------------------------------------------ "tap who came" */

export async function leaderStartPush(nowMs: number, deadline: () => boolean): Promise<number> {
  const events = await scheduledBetween(nowMs + WINDOWS.leaders_10min.fromMs, nowMs + WINDOWS.leaders_10min.toMs);
  let did = 0;
  for (const e of events) {
    if (deadline()) break;
    const ctx = await loadEventContext(e.id, nowMs);
    if (!ctx) continue;
    const leaders = ctx.members.filter((m) => m.isLeader);
    const going = ctx.members.filter((m) => answerOf(ctx, m.userId) === 'going').length;
    const push = await runPush(ctx, {
      key: dedupeKey(e.id, 'leaders_10min', startDay(e)),
      recipients: leaders,
      message: () => ({
        title: `${e.title} starts soon`,
        body: `${going} said they are in. Afterwards, tap who came.`,
        url: `/dashboard/e/${e.id}`,
        tag: `lead-${e.id}`,
      }),
      urgency: 'high',
      ttlSeconds: 3600,
      loud: true,
      ceiling: false,
      retryable: true,
    });
    if (push.pushed > 0) did += 1;
  }
  return did;
}

/* ------------------------------------------------------------ housekeeping */

export async function prune(nowMs: number): Promise<Record<string, number>> {
  const sb = getSupabase();
  const out: Record<string, number> = {};
  const count = (r: { count?: number | null }) => r.count ?? 0;
  // Two days of slack: busy rows are dated in the member's zone, not UTC.
  const busyCutoff = new Date(nowMs - 2 * DAY).toISOString().slice(0, 10);
  const thirtyDays = new Date(nowMs - 30 * DAY).toISOString();

  const [busy, deliveries, nudges, changes, deadPush, stalePending] = await Promise.all([
    sb.from('calendar_busy').delete({ count: 'exact' }).lt('on_date', busyCutoff),
    // Nudge rows are what makes Nudge once-per-event, so they live longer than the rest.
    sb.from('notification_deliveries').delete({ count: 'exact' }).lt('created_at', thirtyDays).not('dedupe_key', 'like', '%:nudge'),
    sb.from('notification_deliveries').delete({ count: 'exact' }).lt('created_at', new Date(nowMs - 120 * DAY).toISOString()).like('dedupe_key', '%:nudge'),
    sb.from('event_changes').delete({ count: 'exact' }).lt('created_at', new Date(nowMs - 180 * DAY).toISOString()),
    sb
      .from('push_subscriptions')
      .delete({ count: 'exact' })
      .lt('last_ok_at', new Date(nowMs - PUSH_PRUNE_DAYS * DAY).toISOString()),
    sb
      .from('notification_deliveries')
      .update({ status: 'failed' }, { count: 'exact' })
      .eq('status', 'pending')
      .lt('created_at', new Date(nowMs - 3_600_000).toISOString()),
  ]);
  out.busy = count(busy);
  out.deliveries = count(deliveries) + count(nudges);
  out.changes = count(changes);
  out.deadPush = count(deadPush);
  out.stalePending = count(stalePending);
  // Subscriptions that never acked at all and are older than the prune window.
  const neverAcked = await sb
    .from('push_subscriptions')
    .delete({ count: 'exact' })
    .is('last_ok_at', null)
    .lt('created_at', new Date(nowMs - PUSH_PRUNE_DAYS * DAY).toISOString());
  out.neverAcked = count(neverAcked);
  await sb.rpc('rate_limit_gc').then(() => undefined, () => undefined);
  return out;
}
