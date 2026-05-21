/**
 * Faithfulness helpers. Deliberately forgiving: we measure return and rhythm,
 * not a fragile consecutive chain. All dates are UTC YYYY-MM-DD strings to
 * match Supabase's `current_date` defaults on done_on.
 */

const MS_DAY = 86_400_000;

/** Today as a UTC YYYY-MM-DD string (matches done_on defaults). */
export function todayUTC(d: Date = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Normalize a list of date-ish strings to a unique set of YYYY-MM-DD. */
export function uniqueDays(dates: string[]): Set<string> {
  return new Set(dates.map((d) => d.slice(0, 10)));
}

/** Count of distinct days something was done. The "days walked with God" total. */
export function totalDays(dates: string[]): number {
  return uniqueDays(dates).size;
}

/** True if the practice was completed today (UTC). */
export function doneToday(dates: string[], ref: Date = new Date()): boolean {
  return uniqueDays(dates).has(todayUTC(ref));
}

/**
 * Current run of consecutive days, but forgiving: if today is not done yet,
 * we anchor on yesterday so an unfinished today never "breaks" the run.
 */
export function currentStreak(dates: string[], ref: Date = new Date()): number {
  const days = uniqueDays(dates);
  let cursor = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor = new Date(cursor.getTime() - MS_DAY); // start from yesterday
  }
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - MS_DAY);
  }
  return streak;
}

/** YYYY-MM-DD strings for the current week, Sunday through Saturday (UTC). */
export function currentWeekDays(ref: Date = new Date()): string[] {
  const r = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const weekStart = new Date(r.getTime() - r.getUTCDay() * MS_DAY);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(weekStart.getTime() + i * MS_DAY).toISOString().slice(0, 10),
  );
}

/** How many days this week the practice was done (0-7). */
export function weekCompletions(dates: string[], ref: Date = new Date()): number {
  const days = uniqueDays(dates);
  return currentWeekDays(ref).filter((d) => days.has(d)).length;
}

/** The last N calendar days as YYYY-MM-DD (oldest first). Good for week strips. */
export function lastNDays(n: number, ref: Date = new Date()): string[] {
  const r = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  return Array.from({ length: n }, (_, i) =>
    new Date(r.getTime() - (n - 1 - i) * MS_DAY).toISOString().slice(0, 10),
  );
}

/** A short, grace-filled line describing this week's rhythm. Never shaming. */
export function faithfulnessLine(weekDone: number, target = 7): string {
  if (weekDone === 0) return 'A fresh week. Whenever you are ready.';
  if (weekDone >= target) return `Faithful all ${target} days this week. Well done.`;
  return `${weekDone} ${weekDone === 1 ? 'day' : 'days'} with God this week. That counts.`;
}
