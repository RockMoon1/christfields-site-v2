/**
 * Availability model. Time is bucketed into three coarse slots per day so
 * members can mark when they are usually free without fuss, and leaders can
 * plan around the group. Pure data + helpers, safe on server or client.
 *
 * Effective free/busy for a given date + slot: a specific-date override wins;
 * otherwise the member's usual weekly pattern decides.
 */

export type Slot = 'morning' | 'afternoon' | 'evening';

export const SLOTS: Slot[] = ['morning', 'afternoon', 'evening'];

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export const SLOT_HINT: Record<Slot, string> = {
  morning: '6am – 12pm',
  afternoon: '12 – 5pm',
  evening: '5 – 10pm',
};

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isSlot(value: string): value is Slot {
  return value === 'morning' || value === 'afternoon' || value === 'evening';
}

export interface UpcomingDay {
  iso: string; // YYYY-MM-DD (UTC)
  weekday: number; // 0=Sun..6=Sat
  dayShort: string;
  dateLabel: string; // e.g. "May 30"
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * The next `count` days starting from today (UTC), each with an ISO date and
 * display labels. Computed in UTC so the server and client agree (no hydration
 * mismatch).
 */
export function upcomingDays(count: number, fromMs: number = Date.now()): UpcomingDay[] {
  const base = new Date(fromMs);
  const start = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
  const out: UpcomingDay[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start + i * 86_400_000);
    out.push({
      iso: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      weekday: d.getUTCDay(),
      dayShort: WEEKDAY_SHORT[d.getUTCDay()],
      dateLabel: `${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}`,
    });
  }
  return out;
}

export function weeklyKey(weekday: number, slot: Slot): string {
  return `${weekday}-${slot}`;
}

export function overrideKey(iso: string, slot: Slot): string {
  return `${iso}-${slot}`;
}

/**
 * Effective free/busy for a date + slot. Precedence:
 *  1. A specific-date override (true=free, false=busy) always wins.
 *  2. Otherwise a connected calendar's busy block makes the slot busy.
 *  3. Otherwise fall back to the usual weekly pattern.
 *
 * calendarBusy holds overrideKey-style "iso-slot" entries the member's calendar
 * marked busy. It is optional, so callers without a calendar pass nothing.
 */
export function isFree(
  iso: string,
  weekday: number,
  slot: Slot,
  weeklyFree: Set<string>,
  overrides: Map<string, boolean>,
  calendarBusy?: Set<string>,
): boolean {
  const ov = overrides.get(overrideKey(iso, slot));
  if (ov !== undefined) return ov;
  if (calendarBusy && calendarBusy.has(overrideKey(iso, slot))) return false;
  return weeklyFree.has(weeklyKey(weekday, slot));
}
