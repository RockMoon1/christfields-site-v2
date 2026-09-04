import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getSupabase,
  type EventRow,
  type EventRsvpRow,
  type EventChangeRow,
  type MemberPrefsRow,
  type PushSubscriptionRow,
} from '@/lib/supabase';
import { getGroupMembers, orgName as lookupOrgName, type GroupMember } from '@/lib/groups/membership';
import { toMemberEvent, type MemberEvent } from '@/lib/schedule/public-event';
import { googleTemplateUrl } from '@/lib/schedule/ics-export';
import { whenInWords } from '@/lib/dashboard/format';
import { noteLines } from '@/lib/dashboard/prompts';
import { appUrl } from '@/lib/dashboard/prefs';
import { mintIcsToken, mintRsvpToken } from './tokens';
import { claimMany, markMany, markOne, anyDelivery, pushCountsSince } from './deliveries';
import { pushToSubs, isPushConfigured, type PushMessage } from './push';
import { peekEmailBudget, takeEmailSlot, sendBatch, isEmailConfigured } from './email';
import { eventMail, type EventLinks, type Mail } from './templates';
import {
  isQuietHour,
  isLiveSub,
  orderByAnswer,
  dedupeKey,
  changedTier,
  countsTowardCeiling,
  utcDayStartIso,
  safeTz,
  REMINDER_PUSH_CEILING,
  type Answer,
  type EmailTier,
  type DeliveryKind,
} from './rules';

/**
 * Everybody gets told. This module turns one event_changes row (or one
 * scheduled trigger) into push and email deliveries, in this order of trust:
 * the Changed strip already has the row; push goes to every subscription;
 * email goes where the rules say, inside the tiered daily budget.
 *
 * Two kinds of caller:
 *  - inline (a leader's post / change / call-off / thanks / nudge) runs once,
 *    so anyone it cannot push right now (quiet hours) is emailed instead;
 *  - the hourly tick (reminders, briefs) retries every hour inside a window,
 *    so it claims only what it can deliver now and leaves the rest unclaimed.
 *
 * Nothing here throws to the caller. A leader's post must never fail because
 * a notification did.
 */

const DAY = 86_400_000;
const EMAIL_CHUNK = 50;

export interface EventContext {
  sb: SupabaseClient;
  event: EventRow;
  member: MemberEvent;
  orgName: string;
  /** Everyone in the group, leaders included. */
  members: GroupMember[];
  prefs: Map<string, MemberPrefsRow>;
  subs: Map<string, PushSubscriptionRow[]>;
  rsvps: Map<string, EventRsvpRow>;
  nowMs: number;
}

export async function loadEventContext(eventId: string, nowMs: number = Date.now()): Promise<EventContext | null> {
  const sb = getSupabase();
  const { data } = await sb.from('events').select('*').eq('id', eventId).maybeSingle();
  if (!data) return null;
  const event = data as EventRow;
  const [members, name] = await Promise.all([getGroupMembers(event.org_id), lookupOrgName(event.org_id)]);
  const ids = members.map((m) => m.userId);
  const [prefsRes, subsRes, rsvpRes] = await Promise.all([
    ids.length ? sb.from('member_prefs').select('*').in('clerk_user_id', ids) : Promise.resolve({ data: [] }),
    ids.length ? sb.from('push_subscriptions').select('*').in('clerk_user_id', ids) : Promise.resolve({ data: [] }),
    sb.from('event_rsvps').select('*').eq('event_id', eventId),
  ]);
  const prefs = new Map<string, MemberPrefsRow>();
  for (const p of (prefsRes.data as MemberPrefsRow[] | null) ?? []) prefs.set(p.clerk_user_id, p);
  const subs = new Map<string, PushSubscriptionRow[]>();
  for (const s of (subsRes.data as PushSubscriptionRow[] | null) ?? []) {
    const list = subs.get(s.clerk_user_id) ?? [];
    list.push(s);
    subs.set(s.clerk_user_id, list);
  }
  const rsvps = new Map<string, EventRsvpRow>();
  for (const r of (rsvpRes.data as EventRsvpRow[] | null) ?? []) rsvps.set(r.clerk_user_id, r);
  return { sb, event, member: toMemberEvent(event, name), orgName: name, members, prefs, subs, rsvps, nowMs };
}

/* ------------------------------------------------------------ helpers */

export function answerOf(ctx: EventContext, userId: string): Answer {
  return ctx.rsvps.get(userId)?.status ?? 'none';
}

export function memberTz(ctx: EventContext, userId: string): string {
  return safeTz(ctx.prefs.get(userId)?.tz, ctx.event.tz);
}

export function hasLivePush(ctx: EventContext, userId: string): boolean {
  return (ctx.subs.get(userId) ?? []).some((s) => isLiveSub(s, ctx.nowMs));
}

export function emailOn(ctx: EventContext, userId: string): boolean {
  return ctx.prefs.get(userId)?.email_reminders ?? true;
}

/** "Thursday, 7pm" in this member's own zone. */
export function whenFor(ctx: EventContext, userId: string): string {
  return whenInWords(ctx.event.starts_at, memberTz(ctx, userId), ctx.nowMs);
}

/**
 * Per-recipient links. Two tokens: the answer token rides in a URL fragment
 * (servers never see it); the .ics token rides in a query string (calendar
 * apps need that) and can only download.
 */
export function linksFor(ctx: EventContext, userId: string): EventLinks {
  const base = appUrl();
  const links: EventLinks = {
    open: `${base}/dashboard/e/${ctx.event.id}`,
    settings: `${base}/dashboard/settings`,
    home: `${base}/dashboard`,
    google: googleTemplateUrl(ctx.member, base),
  };
  const rsvp = mintRsvpToken(ctx.event.id, userId, ctx.event.starts_at);
  const ics = mintIcsToken(ctx.event.id, userId, ctx.event.starts_at);
  if (rsvp) {
    const r = `${base}/r/${ctx.event.id}#t=${encodeURIComponent(rsvp)}`;
    links.rsvp = { going: `${r}&s=going`, maybe: `${r}&s=maybe`, cant: `${r}&s=not_going` };
  }
  if (ics) links.ics = `${base}/api/ics/event/${ctx.event.id}?t=${encodeURIComponent(ics)}`;
  return links;
}

function ids(list: GroupMember[]): string[] {
  return list.map((m) => m.userId);
}

/* ------------------------------------------------------------ push */

export interface PushPlan {
  key: string;
  recipients: GroupMember[];
  /** Built per time zone so the lock screen shows the member's own clock. */
  message: (tz: string) => PushMessage;
  urgency: 'high' | 'normal';
  ttlSeconds: number;
  /** Break quiet hours (same-day cancellations, leaders as it starts). */
  loud: boolean;
  /** Count toward the per-member daily ceiling. */
  ceiling: boolean;
  /** Tick-driven: leave quiet-hour members unclaimed so the next tick can try. */
  retryable: boolean;
}

export interface PushRun {
  pushed: number;
  /** Members skipped for quiet hours (inline callers email them instead). */
  quiet: string[];
}

export async function runPush(ctx: EventContext, plan: PushPlan): Promise<PushRun> {
  const none: PushRun = { pushed: 0, quiet: [] };
  if (!isPushConfigured()) return none;
  const withSubs = plan.recipients.filter((m) => (ctx.subs.get(m.userId) ?? []).length > 0);
  if (withSubs.length === 0) return none;

  const quiet = plan.loud ? [] : withSubs.filter((m) => isQuietHour(ctx.nowMs, memberTz(ctx, m.userId)));
  const quietIds = new Set(ids(quiet));
  const candidates = withSubs.filter((m) => !quietIds.has(m.userId));

  // Inline kinds run once: record the quiet skip so the leader strip stays honest.
  if (!plan.retryable && quiet.length > 0) {
    const q = await claimMany(ctx.sb, plan.key, ids(quiet), 'push');
    await markMany(ctx.sb, plan.key, Array.from(q), 'push', 'skipped_quiet');
  }

  const claimed = await claimMany(ctx.sb, plan.key, ids(candidates), 'push');
  let send = candidates.filter((m) => claimed.has(m.userId));

  if (plan.ceiling && send.length > 0) {
    const counts = await pushCountsSince(ctx.sb, ids(send), utcDayStartIso(ctx.nowMs), countsTowardCeiling);
    const over = send.filter((m) => (counts.get(m.userId) ?? 0) >= REMINDER_PUSH_CEILING);
    if (over.length > 0) {
      await markMany(ctx.sb, plan.key, ids(over), 'push', 'skipped_budget');
      const overIds = new Set(ids(over));
      send = send.filter((m) => !overIds.has(m.userId));
    }
  }
  if (send.length === 0) return { pushed: 0, quiet: ids(quiet) };

  const byTz = new Map<string, PushSubscriptionRow[]>();
  for (const m of send) {
    const tz = memberTz(ctx, m.userId);
    const list = byTz.get(tz) ?? [];
    list.push(...(ctx.subs.get(m.userId) ?? []));
    byTz.set(tz, list);
  }
  const okUsers = new Set<string>();
  for (const [tz, subs] of byTz) {
    const out = await pushToSubs(ctx.sb, subs, plan.message(tz), { urgency: plan.urgency, ttlSeconds: plan.ttlSeconds });
    for (const o of out.outcomes) if (o.ok) okUsers.add(o.userId);
  }
  const sentIds = ids(send.filter((m) => okUsers.has(m.userId)));
  const failedIds = ids(send.filter((m) => !okUsers.has(m.userId)));
  await markMany(ctx.sb, plan.key, sentIds, 'push', 'sent');
  await markMany(ctx.sb, plan.key, failedIds, 'push', 'failed');
  return { pushed: sentIds.length, quiet: ids(quiet) };
}

/* ------------------------------------------------------------ email */

export interface EmailPlan {
  key: string;
  tier: EmailTier;
  /** Already ordered by priority. */
  recipients: GroupMember[];
  build: (m: GroupMember) => Mail;
  /** Tick-driven: claim only what the budget allows now; the rest waits for the next tick. */
  retryable: boolean;
}

export interface EmailRun {
  emailed: number;
  skippedBudget: number;
}

export async function runEmail(ctx: EventContext, plan: EmailPlan): Promise<EmailRun> {
  const none: EmailRun = { emailed: 0, skippedBudget: 0 };
  const withEmail = plan.recipients.filter((m) => !!m.email && m.email.includes('@'));
  if (withEmail.length === 0) return none;
  if (!isEmailConfigured()) {
    const claimed = await claimMany(ctx.sb, plan.key, ids(withEmail), 'email');
    await markMany(ctx.sb, plan.key, Array.from(claimed), 'email', 'failed');
    return none;
  }

  const budget = await peekEmailBudget(plan.tier, ctx.nowMs);
  const pool = plan.retryable ? withEmail.slice(0, budget.available) : withEmail;
  const claimed = await claimMany(ctx.sb, plan.key, ids(pool), 'email');
  const mine = pool.filter((m) => claimed.has(m.userId));
  if (mine.length === 0) return none;
  const allowed = plan.retryable ? mine : mine.slice(0, budget.available);
  const skipped: GroupMember[] = plan.retryable ? [] : mine.slice(budget.available);

  // Take slots one by one and stop at the first refusal (each ask counts).
  const taking: GroupMember[] = [];
  for (let i = 0; i < allowed.length; i++) {
    if (await takeEmailSlot(plan.tier)) taking.push(allowed[i]);
    else {
      skipped.push(...allowed.slice(i));
      break;
    }
  }

  let emailed = 0;
  let refused = 0;
  for (let i = 0; i < taking.length; i += EMAIL_CHUNK) {
    const chunk = taking.slice(i, i + EMAIL_CHUNK);
    const idem = `${plan.key}:${i / EMAIL_CHUNK}:${createHash('sha1').update(ids(chunk).join(',')).digest('hex').slice(0, 16)}`;
    const res = await sendBatch(
      chunk.map((m) => ({ ...plan.build(m), to: m.email })),
      idem,
    );
    if (res.ok) {
      for (let j = 0; j < chunk.length; j++) await markOne(ctx.sb, plan.key, chunk[j].userId, 'email', 'sent', res.ids[j]);
      emailed += chunk.length;
    } else {
      console.error('email batch failed', res.error);
      await markMany(ctx.sb, plan.key, ids(chunk), 'email', res.budget ? 'skipped_budget' : 'failed');
      if (res.budget) refused += chunk.length;
    }
  }
  await markMany(ctx.sb, plan.key, ids(skipped), 'email', 'skipped_budget');
  return { emailed, skippedBudget: skipped.length + refused };
}

/* ------------------------------------------------------------ change fan-out */

export interface FanoutResult {
  pushed: number;
  emailed: number;
  skippedBudget: number;
  quiet: number;
}

const EMPTY: FanoutResult = { pushed: 0, emailed: 0, skippedBudget: 0, quiet: 0 };

function mail(ctx: EventContext, m: GroupMember, kind: Parameters<typeof eventMail>[0]['kind'], extra: { summary?: string; starters?: string[]; weekly?: boolean } = {}): Mail {
  return eventMail({
    kind,
    event: ctx.member,
    whenText: whenFor(ctx, m.userId),
    firstName: m.firstName,
    myAnswer: kind === 'nudge' ? 'none' : answerOf(ctx, m.userId),
    summary: extra.summary,
    starters: extra.starters ?? [],
    links: linksFor(ctx, m.userId),
    weekly: extra.weekly,
  });
}

/** Members who need an email because push cannot reach them right now. */
function needsEmail(ctx: EventContext, quiet: Set<string>) {
  return (m: GroupMember) => emailOn(ctx, m.userId) && (!hasLivePush(ctx, m.userId) || quiet.has(m.userId));
}

/** Push + email for one event_changes row. Runs inline after the leader's write. */
export async function fanOutChange(changeId: string | null): Promise<FanoutResult> {
  if (!changeId) return EMPTY;
  try {
    const sb = getSupabase();
    const { data } = await sb.from('event_changes').select('*').eq('id', changeId).maybeSingle();
    if (!data) return EMPTY;
    const change = data as EventChangeRow;
    const ctx = await loadEventContext(change.event_id);
    if (!ctx) return EMPTY;
    if (ctx.members.length === 0) {
      console.error('fanOutChange: roster empty or unavailable for', ctx.event.org_id);
      return EMPTY;
    }
    const { event } = ctx;
    const startsMs = Date.parse(event.starts_at);
    const others = ctx.members.filter((m) => m.userId !== change.created_by);
    const url = `/dashboard/e/${event.id}`;
    const where = event.location ? ` at ${event.location}` : '';
    const when = (tz: string) => whenInWords(event.starts_at, tz, ctx.nowMs);

    if (change.kind === 'created') {
      const key = dedupeKey(event.id, 'created');
      const weekly = !!event.series_id;
      const push = await runPush(ctx, {
        key,
        recipients: others,
        message: (tz) => ({ title: `New: ${event.title}`, body: `${when(tz)}${where}${weekly ? '. Every week.' : ''}`, url, tag: `event-${event.id}` }),
        urgency: 'normal',
        ttlSeconds: 6 * 3600,
        loud: false,
        ceiling: false,
        retryable: false,
      });
      const quiet = new Set(push.quiet);
      const email = await runEmail(ctx, {
        key,
        tier: 'info',
        recipients: orderByAnswer(others.filter(needsEmail(ctx, quiet)), (m) => answerOf(ctx, m.userId)),
        build: (m) => mail(ctx, m, 'created', { starters: noteLines(event.member_note, 2), weekly }),
        retryable: false,
      });
      return { pushed: push.pushed, quiet: push.quiet.length, ...email };
    }

    if (change.kind === 'changed') {
      const key = dedupeKey(event.id, 'changed', event.version);
      const tier = changedTier(startsMs, ctx.nowMs);
      const push = await runPush(ctx, {
        key,
        recipients: others,
        message: () => ({ title: `${event.title} changed`, body: change.summary.replace(/^[^:]*:\s*/, ''), url, tag: `event-${event.id}` }),
        urgency: 'high',
        ttlSeconds: 12 * 3600,
        loud: false,
        ceiling: false,
        retryable: false,
      });
      const quiet = new Set(push.quiet);
      const soon = startsMs - ctx.nowMs <= 7 * DAY;
      const recipients =
        tier === 'urgent' ? others.filter((m) => emailOn(ctx, m.userId)) : soon ? others.filter(needsEmail(ctx, quiet)) : [];
      const email = await runEmail(ctx, {
        key,
        tier,
        recipients: orderByAnswer(recipients, (m) => answerOf(ctx, m.userId)),
        build: (m) => mail(ctx, m, 'changed', { summary: change.summary }),
        retryable: false,
      });
      return { pushed: push.pushed, quiet: push.quiet.length, ...email };
    }

    if (change.kind === 'cancelled') {
      const key = dedupeKey(event.id, 'cancelled');
      const within12h = startsMs - ctx.nowMs <= 12 * 3_600_000;
      const push = await runPush(ctx, {
        key,
        recipients: others,
        message: (tz) => ({
          title: `${event.title} is called off`,
          body: event.cancel_reason || `Not happening ${when(tz)}.`,
          url,
          tag: `event-${event.id}`,
        }),
        urgency: 'high',
        ttlSeconds: 24 * 3600,
        loud: within12h,
        ceiling: false,
        retryable: false,
      });
      const email = await runEmail(ctx, {
        key,
        tier: 'urgent',
        recipients: orderByAnswer(
          others.filter((m) => emailOn(ctx, m.userId)),
          (m) => answerOf(ctx, m.userId),
        ),
        build: (m) => mail(ctx, m, 'cancelled', { summary: event.cancel_reason }),
        retryable: false,
      });
      return { pushed: push.pushed, quiet: push.quiet.length, ...email };
    }

    if (change.kind === 'thanks') {
      // One thanks per event: a leader fixing a typo re-posts the note, never re-notifies.
      const key = dedupeKey(event.id, 'thanks');
      const came = others.filter((m) => {
        const a = answerOf(ctx, m.userId);
        return a === 'going' || a === 'maybe';
      });
      const push = await runPush(ctx, {
        key,
        recipients: came,
        message: () => ({ title: `Thanks from ${ctx.orgName}`, body: change.summary, url: '/dashboard', tag: `thanks-${event.id}` }),
        urgency: 'normal',
        ttlSeconds: 24 * 3600,
        loud: false,
        ceiling: false,
        retryable: false,
      });
      const quiet = new Set(push.quiet);
      const email = await runEmail(ctx, {
        key,
        tier: 'info',
        recipients: came.filter(needsEmail(ctx, quiet)),
        build: (m) => mail(ctx, m, 'thanks', { summary: change.summary }),
        retryable: false,
      });
      return { pushed: push.pushed, quiet: push.quiet.length, ...email };
    }
    return EMPTY;
  } catch (err) {
    console.error('fanOutChange failed', err);
    return EMPTY;
  }
}

/* ------------------------------------------------------------ nudge */

export interface NudgeResult {
  ok: boolean;
  already?: boolean;
  pushed: number;
  emailed: number;
  skippedBudget: number;
  /** Silent members with neither a push nor an email available right now. */
  unreachable: number;
}

/** A leader asks the people who have not answered. Once per event, one-offs only. */
export async function nudgeSilent(eventId: string, byUserId: string): Promise<NudgeResult> {
  const none: NudgeResult = { ok: false, pushed: 0, emailed: 0, skippedBudget: 0, unreachable: 0 };
  try {
    const ctx = await loadEventContext(eventId);
    if (!ctx || ctx.event.status !== 'scheduled' || ctx.event.series_id) return none;
    const key = dedupeKey(eventId, 'nudge');
    if (await anyDelivery(ctx.sb, key)) return { ...none, ok: true, already: true };
    const silent = ctx.members.filter((m) => m.userId !== byUserId && answerOf(ctx, m.userId) === 'none');
    const url = `/dashboard/e/${eventId}`;
    const push = await runPush(ctx, {
      key,
      recipients: silent,
      message: (tz) => ({
        title: `Are you coming? ${ctx.event.title}`,
        body: `${whenInWords(ctx.event.starts_at, tz, ctx.nowMs)}. One tap tells your leader.`,
        url,
        tag: `event-${eventId}`,
      }),
      urgency: 'normal',
      ttlSeconds: 12 * 3600,
      loud: false,
      ceiling: true,
      retryable: false,
    });
    const quiet = new Set(push.quiet);
    const emailList = silent.filter(needsEmail(ctx, quiet));
    const email = await runEmail(ctx, {
      key,
      tier: 'reminder',
      recipients: emailList,
      build: (m) => mail(ctx, m, 'nudge'),
      retryable: false,
    });
    const reached = push.pushed + email.emailed;
    return {
      ok: true,
      pushed: push.pushed,
      emailed: email.emailed,
      skippedBudget: email.skippedBudget,
      unreachable: Math.max(0, silent.length - reached - email.skippedBudget),
    };
  } catch (err) {
    console.error('nudgeSilent failed', err);
    return none;
  }
}

export type { DeliveryKind };
