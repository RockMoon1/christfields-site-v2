import { dayKeyInZone } from './timezone';

/**
 * Availability model. Time is bucketed into three coarse slots per day so
 * members can mark when they are usually free without fuss, and leaders can
 * plan around the group. Pure data + helpers, safe on server or client.
 *
 * Effective free/busy for a given date + slot: a specific-date override wins;
 * otherwise a connected calendar's busy block; otherwise the usual weekly pattern.
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

/** A representative hour for each slot, used to prefill a time from a heatmap cell. */
export const SLOT_DEFAULT_HOUR: Record<Slot, number> = {
  morning: 9,
  afternoon: 14,
  evening: 19,
};

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isSlot(value: string): value is Slot {
  return value === 'morning' || value === 'afternoon' || value === 'evening';
}

export interface UpcomingDay {
  iso: string; // YYYY-MM-DD, a calendar date in the requested zone
  weekday: number; // 0=Sun..6=Sat
  dayShort: string;
  dateLabel: string; // e.g. "May 30"
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * The next `count` calendar days starting from today, each with an ISO date and
 * display labels. `tz` decides which calendar day "today" is; without it the
 * computation is in UTC (the old behaviour, still hydration-safe). Every caller
 * that knows the member's or the group's zone should pass it, so a Colorado
 * evening lands on the right row.
 */
export function upcomingDays(count: number, fromMs: number = Date.now(), tz?: string): UpcomingDay[] {
  const base = new Date(fromMs);
  const startKey = tz ? dayKeyInZone(tz, base) : base.toISOString().slice(0, 10);
  const start = Date.UTC(
    Number(startKey.slice(0, 4)),
    Number(startKey.slice(5, 7)) - 1,
    Number(startKey.slice(8, 10)),
  );
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

/** Which coarse slot a local hour falls in; night hours belong to none. Client-safe. */
export function slotForLocalHour(hour: number): Slot | null {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return null;
}

export interface MemberAvailability {
  weekly: Set<string>;
  overrides: Map<string, boolean>;
  busy: Set<string>;
  /** A pasted calendar link or a Google free/busy connection. */
  hasCalendarSource: boolean;
}

/**
 * Effective free/busy for one member on a date + slot. Precedence:
 *  1. A specific-date override (true=free, false=busy) always wins.
 *  2. A calendar busy block makes the slot busy.
 *  3. A member who connected a calendar and never tapped the weekly grid is
 *     free wherever the calendar is not busy: "let your calendar fill this in"
 *     has to mean exactly that.
 *  4. Otherwise the usual weekly pattern decides.
 */
export function memberIsFree(iso: string, weekday: number, slot: Slot, m: MemberAvailability): boolean {
  const ov = m.overrides.get(overrideKey(iso, slot));
  if (ov !== undefined) return ov;
  if (m.busy.has(overrideKey(iso, slot))) return false;
  if (m.weekly.size === 0) return m.hasCalendarSource;
  return m.weekly.has(weeklyKey(weekday, slot));
}

/**
 * Effective free/busy for a date + slot (older form, weekly pattern only as the
 * baseline). Precedence:
 *  1. A specific-date override (true=free, false=busy) always wins.
 *  2. Otherwise a connected calendar's busy block makes the slot busy.
 *  3. Otherwise fall back to the usual weekly pattern.
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
