/**
 * The pure rules behind every notification. No I/O, so they are unit-tested
 * and the fan-out / tick code stays a thin layer over them.
 *
 * Numbers here are product decisions from the 2026-09 plan:
 *  - Email is one shared Resend account (100/day hard cap, also used by the
 *    public forms), so the app keeps to 80 and lets cancellations outrank
 *    reminders, which outrank "new post" mail.
 *  - Push liveness is measured by device ack, not by the push service's answer,
 *    because Apple may silently drop a subscription without a 404/410.
 *  - Quiet hours are fixed and have no UI.
 */

export const TIER_LIMITS = { urgent: 80, reminder: 65, info: 50 } as const;
export type EmailTier = keyof typeof TIER_LIMITS;

export const EMAIL_BUCKET = 'resend:day';
export const EMAIL_WINDOW_SECONDS = 86_400;

export const PUSH_LIVE_DAYS = 14;
export const PUSH_PRUNE_DAYS = 60;
/** Subscriptions per member; the oldest beyond this are dropped. */
export const PUSH_MAX_PER_MEMBER = 5;
export const QUIET_START_HOUR = 21;
export const QUIET_END_HOUR = 7;
/** Reminders and nudges per member per day. Posts, changes, and cancellations are exempt. */
export const REMINDER_PUSH_CEILING = 2;

export type Answer = 'going' | 'maybe' | 'not_going' | 'none';

const DAY = 86_400_000;

export function safeTz(tz: string | null | undefined, fallback: string): string {
  if (!tz || tz === 'UTC') return fallback;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return fallback;
  }
}

/** 0-23 in the zone. */
export function localHour(nowMs: number, tz: string): number {
  const h = new Intl.DateTimeFormat('en-US', { timeZone: safeTz(tz, 'UTC'), hour: 'numeric', hour12: false }).format(
    new Date(nowMs),
  );
  const n = Number(h);
  // Some ICU builds print "24" for midnight.
  return Number.isFinite(n) ? n % 24 : 12;
}

export function isQuietHour(nowMs: number, tz: string): boolean {
  const h = localHour(nowMs, tz);
  return h >= QUIET_START_HOUR || h < QUIET_END_HOUR;
}

export function isLiveSub(sub: { fail_count: number; last_ok_at: string | null }, nowMs: number): boolean {
  if (sub.fail_count > 0 || !sub.last_ok_at) return false;
  const ok = Date.parse(sub.last_ok_at);
  return Number.isFinite(ok) && ok >= nowMs - PUSH_LIVE_DAYS * DAY;
}

/** Cancellations first reach the people who said yes; declines hear last. */
const ANSWER_RANK: Record<Answer, number> = { going: 0, maybe: 1, none: 2, not_going: 3 };

export function orderByAnswer<T>(people: T[], answerOf: (p: T) => Answer): T[] {
  return [...people].sort((a, b) => ANSWER_RANK[answerOf(a)] - ANSWER_RANK[answerOf(b)]);
}

export type DeliveryKind =
  | 'created'
  | 'changed'
  | 'cancelled'
  | 'thanks'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'nudge'
  | 'leader_brief'
  | 'leaders_10min'
  | 'rhythm'
  | 'safety'
  | 'safety_reveal'
  | 'prayer_posted'
  | 'prayer_answered';

export function dedupeKey(eventId: string, kind: DeliveryKind, discriminator?: string | number): string {
  return discriminator === undefined ? `${eventId}:${kind}` : `${eventId}:${kind}:${discriminator}`;
}

/** Keys that count toward the per-member daily push ceiling (posts, changes, cancellations are exempt). */
export function countsTowardCeiling(key: string): boolean {
  return /:(reminder_24h|reminder_2h|nudge|rhythm|prayer_posted|prayer_answered)(:|$)/.test(key);
}

export function utcDayStartIso(nowMs: number): string {
  const d = new Date(nowMs);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

/** The fixed window rate_limit_take() uses for a one-day bucket, as an ISO timestamp. */
export function emailWindowStartIso(nowMs: number): string {
  const sec = Math.floor(nowMs / 1000 / EMAIL_WINDOW_SECONDS) * EMAIL_WINDOW_SECONDS;
  return new Date(sec * 1000).toISOString();
}

/** Which tier a "changed" notice falls in: same-day moves are urgent. */
export function changedTier(startsAtMs: number, nowMs: number): EmailTier {
  return startsAtMs - nowMs <= 24 * 60 * 60 * 1000 ? 'urgent' : 'info';
}

/** Resend refusals that mean "the account is out of sends", not "this address is bad". */
export function isEmailBudgetError(name: string | undefined, message: string | undefined): boolean {
  const s = `${name ?? ''} ${message ?? ''}`.toLowerCase();
  return /quota|rate.?limit|too many requests/.test(s);
}

/**
 * Time windows the hourly tick scans, relative to now. Wide on purpose (the
 * tick can run at any minute and may skip an hour); dedupe keys make the first
 * successful hit the only hit, and quiet-hour members are left unclaimed so a
 * later tick inside the window still reaches them.
 */
export const WINDOWS = {
  reminder_24h: { fromMs: 22 * 3_600_000, toMs: 26 * 3_600_000 },
  reminder_2h: { fromMs: 1 * 3_600_000, toMs: 3 * 3_600_000 },
  /** Starts a little before now so an event at :00 is not missed by a tick at :00:30. */
  leaders_10min: { fromMs: -30 * 60_000, toMs: 1 * 3_600_000 },
} as const;
