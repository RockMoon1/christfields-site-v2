/**
 * The member's own calendar day.
 *
 * A day boundary is a human thing, not a server thing: an examen written at
 * 9pm in Colorado belongs to that evening, not to tomorrow. The browser knows
 * the zone, so it writes it to a cookie once (see TimeZoneSync) and every
 * server component and action reads it from there. No database column and no
 * migration needed, and it works the same in server components and actions.
 *
 * If the cookie is missing or nonsense, everything falls back to UTC, which is
 * exactly how the dashboard behaved before.
 */

export const TZ_COOKIE = 'cf_tz';

/** True if the string is a timezone this runtime actually recognizes. */
export function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64 || !/^[A-Za-z0-9+_\-/]+$/.test(tz)) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Today as YYYY-MM-DD in the given zone. en-CA formats as YYYY-MM-DD. */
export function dayKeyInZone(timeZone: string, d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** How far the zone is from UTC at a given instant, in milliseconds. */
function zoneOffsetMs(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asIfUTC = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  );
  return asIfUTC - at.getTime();
}

/** The instant a member's local calendar day begins, as epoch ms. */
function zonedDayStartMs(timeZone: string, dayKey: string): number {
  const naive = new Date(`${dayKey}T00:00:00Z`).getTime();
  const guess = naive - zoneOffsetMs(timeZone, new Date(naive));
  // One refinement so days that begin across a DST change still land right.
  const refined = naive - zoneOffsetMs(timeZone, new Date(guess));
  return refined;
}

/**
 * The UTC instants bounding a member's local calendar day, for querying
 * timestamp columns (mood check-ins) rather than plain date columns.
 */
export function zonedDayRangeUTC(
  timeZone: string,
  dayKey: string,
): { start: string; end: string } {
  try {
    const start = zonedDayStartMs(timeZone, dayKey);
    const nextKey = new Date(new Date(`${dayKey}T00:00:00Z`).getTime() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    const end = zonedDayStartMs(timeZone, nextKey);
    return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
  } catch {
    return { start: `${dayKey}T00:00:00.000Z`, end: `${dayKey}T23:59:59.999Z` };
  }
}
