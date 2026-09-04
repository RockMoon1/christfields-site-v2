import { getSupabase, type EventRow, type EventSlotRow, type EventSlotClaimRow } from '@/lib/supabase';
import { whenInWords } from '@/lib/dashboard/format';
import { noteLines } from '@/lib/dashboard/prompts';
import { dayKeyInZone } from '@/lib/dashboard/timezone';
import { appUrl } from '@/lib/dashboard/prefs';
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
          openUrl: `${appUrl()}/dashboard/e/${e.id}`,
        }),
      retryable: true,
    });
    if (email.emailed > 0) did += 1;
  }
  return did;
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
