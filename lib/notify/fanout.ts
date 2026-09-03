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
import { isTokenConfigured, mintToken, tokenExpiryFor } from './tokens';
import { claimMany, markMany, markOne, anyDelivery, pushCountsSince } from './deliveries';
import { pushToSubs, isPushConfigured, type PushMessage } from './push';
import { peekEmailBudget, takeEmailSlot, sendOne, isEmailConfigured } from './email';
import { eventMail, type EventLinks } from './templates';
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
 * Nothing here throws to the caller. A leader's post must never fail because
 * a notification did.
 */

const DAY = 86_400_000;

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

function emailOn(ctx: EventContext, userId: string): boolean {
  return ctx.prefs.get(userId)?.email_reminders ?? true;
}

export function linksFor(ctx: EventContext, userId: string): EventLinks {
  const base = appUrl();
  const links: EventLinks = {
    open: `${base}/dashboard/e/${ctx.event.id}`,
    settings: `${base}/dashboard/settings`,
    google: googleTemplateUrl(ctx.member, base),
  };
  if (isTokenConfigured()) {
    const t = mintToken({ eventId: ctx.event.id, userId, expMs: tokenExpiryFor(ctx.event.starts_at) });
    const r = `${base}/r/${ctx.event.id}#t=${encodeURIComponent(t)}`;
    links.rsvp = { going: `${r}&s=going`, maybe: `${r}&s=maybe`, cant: `${r}&s=not_going` };
    links.ics = `${base}/api/ics/event/${ctx.event.id}?t=${encodeURIComponent(t)}`;
  }
  return links;
}

export interface FanoutResult {
  pushed: number;
  emailed: number;
  skippedBudget: number;
  skippedQuiet: number;
}

const EMPTY: FanoutResult = { pushed: 0, emailed: 0, skippedBudget: 0, skippedQuiet: 0 };

interface PushPlan {
  key: string;
  recipients: GroupMember[];
  message: PushMessage;
  urgency: 'high' | 'normal';
  ttlSeconds: number;
  /** Break quiet hours (same-day cancellations). */
  loud: boolean;
  /** Count toward the per-member daily ceiling. */
  ceiling: boolean;
}

/** Push to a set of members: claim per member, send to all their subscriptions. */
export async function runPush(ctx: EventContext, plan: PushPlan): Promise<{ pushed: number; skippedQuiet: number }> {
  if (!isPushConfigured()) return { pushed: 0, skippedQuiet: 0 };
  const withSubs = plan.recipients.filter((m) => (ctx.subs.get(m.userId) ?? []).length > 0);
  if (withSubs.length === 0) return { pushed: 0, skippedQuiet: 0 };

  const claimed = await claimMany(ctx.sb, plan.key, withSubs.map((m) => m.userId), 'push');
  if (claimed.size === 0) return { pushed: 0, skippedQuiet: 0 };

  const counts = plan.ceiling
    ? await pushCountsSince(ctx.sb, Array.from(claimed), utcDayStartIso(ctx.nowMs), countsTowardCeiling)
    : new Map<string, number>();

  const quiet: string[] = [];
  const over: string[] = [];
  const send: GroupMember[] = [];
  for (const m of withSubs) {
    if (!claimed.has(m.userId)) continue;
    if (!plan.loud && isQuietHour(ctx.nowMs, memberTz(ctx, m.userId))) {
      quiet.push(m.userId);
      continue;
    }
    // The row for THIS send already exists (claimed), so the ceiling check is "> ceiling".
    if (plan.ceiling && (counts.get(m.userId) ?? 0) > REMINDER_PUSH_CEILING) {
      over.push(m.userId);
      continue;
    }
    send.push(m);
  }
  await markMany(ctx.sb, plan.key, quiet, 'push', 'skipped_quiet');
  await markMany(ctx.sb, plan.key, over, 'push', 'skipped_budget');

  const sentIds: string[] = [];
  const failedIds: string[] = [];
  for (const m of send) {
    const subs = ctx.subs.get(m.userId) ?? [];
    const out = await pushToSubs(ctx.sb, subs, plan.message, { urgency: plan.urgency, ttlSeconds: plan.ttlSeconds });
    if (out.sent > 0) sentIds.push(m.userId);
    else failedIds.push(m.userId);
  }
  await markMany(ctx.sb, plan.key, sentIds, 'push', 'sent');
  await markMany(ctx.sb, plan.key, failedIds, 'push', 'failed');
  return { pushed: sentIds.length, skippedQuiet: quiet.length };
}

interface EmailPlan {
  key: string;
  tier: EmailTier;
  /** Already ordered by priority. */
  recipients: GroupMember[];
  build: (m: GroupMember) => { subject: string; html: string; text: string };
}

/** Email inside the tiered budget: peek, claim, send while slots last, mark the rest skipped. */
export async function runEmail(ctx: EventContext, plan: EmailPlan): Promise<{ emailed: number; skippedBudget: number }> {
  const withEmail = plan.recipients.filter((m) => !!m.email && m.email.includes('@'));
  if (withEmail.length === 0) return { emailed: 0, skippedBudget: 0 };
  if (!isEmailConfigured()) {
    const claimed = await claimMany(ctx.sb, plan.key, withEmail.map((m) => m.userId), 'email');
    await markMany(ctx.sb, plan.key, Array.from(claimed), 'email', 'failed');
    return { emailed: 0, skippedBudget: 0 };
  }

  const claimed = await claimMany(ctx.sb, plan.key, withEmail.map((m) => m.userId), 'email');
  if (claimed.size === 0) return { emailed: 0, skippedBudget: 0 };
  const mine = withEmail.filter((m) => claimed.has(m.userId));

  const budget = await peekEmailBudget(plan.tier, ctx.nowMs);
  const allowed = mine.slice(0, budget.available);
  const skipped = mine.slice(budget.available);

  let emailed = 0;
  const skippedIds = skipped.map((m) => m.userId);
  for (const m of allowed) {
    const slot = await takeEmailSlot(plan.tier);
    if (!slot) {
      skippedIds.push(m.userId);
      continue;
    }
    const mail = plan.build(m);
    const res = await sendOne({ ...mail, to: m.email, idempotencyKey: `${plan.key}:${m.userId}` });
    await markOne(ctx.sb, plan.key, m.userId, 'email', res.ok ? 'sent' : 'failed', res.id);
    if (res.ok) emailed += 1;
    else console.error('email send failed', res.error);
  }
  await markMany(ctx.sb, plan.key, skippedIds, 'email', 'skipped_budget');
  return { emailed, skippedBudget: skippedIds.length };
}

/* ------------------------------------------------------------ change fan-out */

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
    const { event } = ctx;
    const startsMs = Date.parse(event.starts_at);
    const others = ctx.members.filter((m) => m.userId !== change.created_by);
    const url = `/dashboard/e/${event.id}`;
    const result: FanoutResult = { ...EMPTY };

    if (change.kind === 'created') {
      const key = dedupeKey(event.id, 'created');
      const weekly = !!event.series_id;
      const push = await runPush(ctx, {
        key,
        recipients: others,
        message: {
          title: `New: ${event.title}`,
          body: `${whenInWords(event.starts_at, event.tz, ctx.nowMs)}${event.location ? ` at ${event.location}` : ''}${weekly ? '. Every week.' : ''}`,
          url,
          tag: `event-${event.id}`,
        },
        urgency: 'normal',
        ttlSeconds: 6 * 3600,
        loud: false,
        ceiling: false,
      });
      const recipients = others.filter((m) => emailOn(ctx, m.userId) && !hasLivePush(ctx, m.userId));
      const email = await runEmail(ctx, {
        key,
        tier: 'info',
        recipients: orderByAnswer(recipients, (m) => answerOf(ctx, m.userId)),
        build: (m) =>
          eventMail({
            kind: 'created',
            event: ctx.member,
            whenText: whenInWords(event.starts_at, memberTz(ctx, m.userId), ctx.nowMs),
            firstName: m.firstName,
            myAnswer: answerOf(ctx, m.userId),
            starters: noteLines(event.member_note, 2),
            links: linksFor(ctx, m.userId),
            weekly,
          }),
      });
      Object.assign(result, { pushed: push.pushed, skippedQuiet: push.skippedQuiet, ...email });
    } else if (change.kind === 'changed') {
      const key = dedupeKey(event.id, 'changed', event.version);
      const tier = changedTier(startsMs, ctx.nowMs);
      const push = await runPush(ctx, {
        key,
        recipients: others,
        message: { title: `${event.title} changed`, body: change.summary.replace(/^[^:]*:\s*/, ''), url, tag: `event-${event.id}` },
        urgency: 'high',
        ttlSeconds: 12 * 3600,
        loud: false,
        ceiling: false,
      });
      const soon = startsMs - ctx.nowMs <= 7 * DAY;
      const recipients =
        tier === 'urgent'
          ? others.filter((m) => emailOn(ctx, m.userId))
          : soon
            ? others.filter((m) => emailOn(ctx, m.userId) && !hasLivePush(ctx, m.userId))
            : [];
      const email = await runEmail(ctx, {
        key,
        tier,
        recipients: orderByAnswer(recipients, (m) => answerOf(ctx, m.userId)),
        build: (m) =>
          eventMail({
            kind: 'changed',
            event: ctx.member,
            whenText: whenInWords(event.starts_at, memberTz(ctx, m.userId), ctx.nowMs),
            firstName: m.firstName,
            myAnswer: answerOf(ctx, m.userId),
            summary: change.summary,
            starters: [],
            links: linksFor(ctx, m.userId),
          }),
      });
      Object.assign(result, { pushed: push.pushed, skippedQuiet: push.skippedQuiet, ...email });
    } else if (change.kind === 'cancelled') {
      const key = dedupeKey(event.id, 'cancelled');
      const within12h = startsMs - ctx.nowMs <= 12 * 3_600_000;
      const push = await runPush(ctx, {
        key,
        recipients: others,
        message: {
          title: `${event.title} is called off`,
          body: event.cancel_reason || `Not happening ${whenInWords(event.starts_at, event.tz, ctx.nowMs)}.`,
          url,
          tag: `event-${event.id}`,
        },
        urgency: 'high',
        ttlSeconds: 24 * 3600,
        loud: within12h,
        ceiling: false,
      });
      const recipients = others.filter((m) => emailOn(ctx, m.userId));
      const email = await runEmail(ctx, {
        key,
        tier: 'urgent',
        recipients: orderByAnswer(recipients, (m) => answerOf(ctx, m.userId)),
        build: (m) =>
          eventMail({
            kind: 'cancelled',
            event: ctx.member,
            whenText: whenInWords(event.starts_at, memberTz(ctx, m.userId), ctx.nowMs),
            firstName: m.firstName,
            myAnswer: answerOf(ctx, m.userId),
            summary: event.cancel_reason,
            starters: [],
            links: linksFor(ctx, m.userId),
          }),
      });
      Object.assign(result, { pushed: push.pushed, skippedQuiet: push.skippedQuiet, ...email });
    } else if (change.kind === 'thanks') {
      const key = dedupeKey(event.id, 'thanks', change.id);
      const came = others.filter((m) => {
        const a = answerOf(ctx, m.userId);
        return a === 'going' || a === 'maybe';
      });
      const push = await runPush(ctx, {
        key,
        recipients: came,
        message: { title: `Thanks from ${ctx.orgName}`, body: change.summary, url: '/dashboard', tag: `thanks-${event.id}` },
        urgency: 'normal',
        ttlSeconds: 24 * 3600,
        loud: false,
        ceiling: false,
      });
      const email = await runEmail(ctx, {
        key,
        tier: 'info',
        recipients: came.filter((m) => emailOn(ctx, m.userId) && !hasLivePush(ctx, m.userId)),
        build: (m) =>
          eventMail({
            kind: 'thanks',
            event: ctx.member,
            whenText: whenInWords(event.starts_at, memberTz(ctx, m.userId), ctx.nowMs),
            firstName: m.firstName,
            myAnswer: answerOf(ctx, m.userId),
            summary: change.summary,
            starters: [],
            links: linksFor(ctx, m.userId),
          }),
      });
      Object.assign(result, { pushed: push.pushed, skippedQuiet: push.skippedQuiet, ...email });
    }
    return result;
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
  quiet: number;
}

/** A leader asks the people who have not answered. Once per event, one-offs only. */
export async function nudgeSilent(eventId: string, byUserId: string): Promise<NudgeResult> {
  const none: NudgeResult = { ok: false, pushed: 0, emailed: 0, skippedBudget: 0, quiet: 0 };
  try {
    const ctx = await loadEventContext(eventId);
    if (!ctx || ctx.event.status !== 'scheduled' || ctx.event.series_id) return none;
    const key = dedupeKey(eventId, 'nudge');
    if (await anyDelivery(ctx.sb, key)) return { ...none, ok: true, already: true };
    const silent = ctx.members.filter((m) => m.userId !== byUserId && answerOf(ctx, m.userId) === 'none');
    const url = `/dashboard/e/${eventId}`;
    const when = whenInWords(ctx.event.starts_at, ctx.event.tz, ctx.nowMs);
    const push = await runPush(ctx, {
      key,
      recipients: silent,
      message: { title: `Are you coming? ${ctx.event.title}`, body: `${when}. One tap tells your leader.`, url, tag: `event-${eventId}` },
      urgency: 'normal',
      ttlSeconds: 12 * 3600,
      loud: false,
      ceiling: true,
    });
    const email = await runEmail(ctx, {
      key,
      tier: 'reminder',
      recipients: silent.filter((m) => emailOn(ctx, m.userId) && !hasLivePush(ctx, m.userId)),
      build: (m) =>
        eventMail({
          kind: 'nudge',
          event: ctx.member,
          whenText: whenInWords(ctx.event.starts_at, memberTz(ctx, m.userId), ctx.nowMs),
          firstName: m.firstName,
          myAnswer: 'none',
          starters: [],
          links: linksFor(ctx, m.userId),
        }),
    });
    return { ok: true, pushed: push.pushed, emailed: email.emailed, skippedBudget: email.skippedBudget, quiet: push.skippedQuiet };
  } catch (err) {
    console.error('nudgeSilent failed', err);
    return none;
  }
}

export type { DeliveryKind };
