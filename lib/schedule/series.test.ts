import { describe, expect, it } from 'vitest';
import { weeklyOccurrences, MAX_SERIES_WEEKS, zonedToUtcMs } from './series';

const DENVER = 'America/Denver';

/** "Tue 7:00 PM" regardless of how this ICU build punctuates it. */
function denverWallClock(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DENVER,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/,\s*/g, ' ')
    .replace(/ /g, ' ');
}

describe('weekly series', () => {
  it('produces N rows a week apart', () => {
    // Tuesday 2026-09-08 19:00 in Denver (MDT, UTC-6) = 01:00Z on the 9th.
    const start = new Date(zonedToUtcMs(DENVER, { year: 2026, month: 9, day: 8, hour: 19, minute: 0 })).toISOString();
    const rows = weeklyOccurrences(start, null, DENVER, 4);
    expect(rows).toHaveLength(4);
    expect(rows[0].startsAt).toBe(start);
    for (const r of rows) expect(denverWallClock(r.startsAt)).toBe('Tue 7:00 PM');
  });

  it('keeps the same wall-clock time across a daylight-saving change', () => {
    // Denver leaves DST on 2026-11-01. Start the Tuesday before, run 3 weeks.
    const start = new Date(zonedToUtcMs(DENVER, { year: 2026, month: 10, day: 27, hour: 19, minute: 0 })).toISOString();
    const rows = weeklyOccurrences(start, null, DENVER, 3);
    expect(rows.map((r) => denverWallClock(r.startsAt))).toEqual(['Tue 7:00 PM', 'Tue 7:00 PM', 'Tue 7:00 PM']);
    // The UTC instants differ by 7 days + 1 hour after the change.
    const a = new Date(rows[0].startsAt).getTime();
    const b = new Date(rows[1].startsAt).getTime();
    expect(b - a).toBe(7 * 86_400_000 + 3_600_000);
  });

  it('carries the duration and clamps weeks', () => {
    const start = '2026-09-08T01:00:00.000Z';
    const end = '2026-09-08T02:30:00.000Z';
    const rows = weeklyOccurrences(start, end, DENVER, 99);
    expect(rows).toHaveLength(MAX_SERIES_WEEKS);
    for (const r of rows) {
      expect(new Date(r.endsAt as string).getTime() - new Date(r.startsAt).getTime()).toBe(90 * 60_000);
    }
    expect(weeklyOccurrences(start, null, DENVER, 0)).toHaveLength(1);
  });

  it('returns nothing for a bad start', () => {
    expect(weeklyOccurrences('not a date', null, DENVER, 3)).toEqual([]);
  });
});
