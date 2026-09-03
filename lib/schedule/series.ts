/**
 * Weekly-for-N-weeks series, materialised as plain event rows sharing a
 * series_id. Finite on purpose: no rrule engine, no open-ended top-up, no
 * exceptions. A church group's weekly gathering plus the occasional meal is
 * exactly this shape; anything richer waits for a leader to ask.
 *
 * Each occurrence keeps the same WALL-CLOCK time in the leader's zone, so a
 * 7pm Tuesday stays 7pm across a daylight-saving change.
 */

export const MAX_SERIES_WEEKS = 12;

interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

function wallClockIn(tz: string, ms: number): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
}

/** How far the zone is from UTC at an instant, in ms. */
function zoneOffsetMs(tz: string, ms: number): number {
  const w = wallClockIn(tz, ms);
  const asIfUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, 0);
  return asIfUtc - Math.floor(ms / 60_000) * 60_000;
}

/** The instant a wall-clock time happens in a zone. */
export function zonedToUtcMs(tz: string, w: WallClock): number {
  const naive = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, 0);
  const guess = naive - zoneOffsetMs(tz, naive);
  return naive - zoneOffsetMs(tz, guess);
}

function addDaysToWallClock(w: WallClock, days: number): WallClock {
  const d = new Date(Date.UTC(w.year, w.month - 1, w.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: w.hour, minute: w.minute };
}

export interface Occurrence {
  startsAt: string;
  endsAt: string | null;
}

/**
 * The start (and end) instants for `weeks` weekly occurrences beginning at
 * `startsAtISO`, in the leader's zone. weeks is clamped to [1, MAX_SERIES_WEEKS].
 */
export function weeklyOccurrences(
  startsAtISO: string,
  endsAtISO: string | null,
  tz: string,
  weeks: number,
): Occurrence[] {
  const n = Math.max(1, Math.min(MAX_SERIES_WEEKS, Math.floor(weeks || 1)));
  const startMs = new Date(startsAtISO).getTime();
  if (Number.isNaN(startMs)) return [];
  const durationMs =
    endsAtISO && !Number.isNaN(new Date(endsAtISO).getTime())
      ? Math.max(0, new Date(endsAtISO).getTime() - startMs)
      : null;

  let zone = tz;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    zone = 'UTC';
  }

  const first = wallClockIn(zone, startMs);
  const out: Occurrence[] = [];
  for (let i = 0; i < n; i += 1) {
    const w = addDaysToWallClock(first, i * 7);
    const s = zonedToUtcMs(zone, w);
    out.push({
      startsAt: new Date(s).toISOString(),
      endsAt: durationMs === null ? null : new Date(s + durationMs).toISOString(),
    });
  }
  return out;
}
