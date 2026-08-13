/**
 * Faithfulness helpers. Deliberately forgiving: we measure return and rhythm,
 * not a fragile consecutive chain.
 *
 * Every function works on day KEYS (YYYY-MM-DD strings), never on a raw Date,
 * because "today" depends on where the member is standing. Computing the day
 * in UTC meant a member in Colorado who did their examen at 9pm had it filed
 * under tomorrow, saw yesterday as missed, and found today already ticked off
 * the next morning. Callers pass the member's own day key (see
 * lib/dashboard/timezone.ts); the UTC default keeps leader-side analytics,
 * where there is no single member to localize to, behaving exactly as before.
 *
 * Arithmetic walks these keys in UTC space on purpose: they are date-only
 * values, so calendar math on them is exact and never touched by DST.
 */

const MS_DAY = 86_400_000;

/** Today as a UTC YYYY-MM-DD string. The fallback when no zone is known. */
export function todayUTC(d: Date = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Step a YYYY-MM-DD key by whole days. */
function shiftKey(key: string, days: number): string {
  return new Date(new Date(`${key}T00:00:00Z`).getTime() + days * MS_DAY)
    .toISOString()
    .slice(0, 10);
}

/** The day of the week for a key, 0 = Sunday. */
function weekdayOfKey(key: string): number {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}

/** Normalize a list of date-ish strings to a unique set of YYYY-MM-DD. */
export function uniqueDays(dates: string[]): Set<string> {
  return new Set(dates.map((d) => d.slice(0, 10)));
}

/** Count of distinct days something was done. The "days walked with God" total. */
export function totalDays(dates: string[]): number {
  return uniqueDays(dates).size;
}

/** True if the practice was completed on the member's today. */
export function doneToday(dates: string[], today: string = todayUTC()): boolean {
  return uniqueDays(dates).has(today);
}

/**
 * Current run of consecutive days, but forgiving: if today is not done yet,
 * we anchor on yesterday so an unfinished today never "breaks" the run.
 */
export function currentStreak(dates: string[], today: string = todayUTC()): number {
  const days = uniqueDays(dates);
  let cursor = days.has(today) ? today : shiftKey(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

/** YYYY-MM-DD strings for the member's current week, Sunday through Saturday. */
export function currentWeekDays(today: string = todayUTC()): string[] {
  const weekStart = shiftKey(today, -weekdayOfKey(today));
  return Array.from({ length: 7 }, (_, i) => shiftKey(weekStart, i));
}

/** How many days this week the practice was done (0-7). */
export function weekCompletions(dates: string[], today: string = todayUTC()): number {
  const days = uniqueDays(dates);
  return currentWeekDays(today).filter((d) => days.has(d)).length;
}

/** The last N calendar days as YYYY-MM-DD (oldest first). Good for week strips. */
export function lastNDays(n: number, today: string = todayUTC()): string[] {
  return Array.from({ length: n }, (_, i) => shiftKey(today, -(n - 1 - i)));
}

/** A short, grace-filled line describing this week's rhythm. Never shaming. */
export function faithfulnessLine(weekDone: number, target = 7): string {
  if (weekDone === 0) return 'A fresh week. Whenever you are ready.';
  if (weekDone >= target) return `Faithful all ${target} days this week. Well done.`;
  return `${weekDone} ${weekDone === 1 ? 'day' : 'days'} with God this week. That counts.`;
}
