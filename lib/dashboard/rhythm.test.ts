import { describe, expect, it } from 'vitest';
import { lastSeenByMember, notSeenLately, nudgeDue, RHYTHM_DAYS } from './rhythm';
import { questionForWeek, weekKey, weekOf, QUESTIONS } from './questions';

const DAY = 86_400_000;
const now = Date.UTC(2026, 8, 20, 12);

describe('two-week rhythm', () => {
  const eventStarts = new Map([
    ['e1', new Date(now - 20 * DAY).toISOString()],
    ['e2', new Date(now - 5 * DAY).toISOString()],
    ['e3', new Date(now + 3 * DAY).toISOString()], // upcoming: does not count as seen
  ]);

  it('takes the most recent of attendance or a past yes, ignoring the future', () => {
    const seen = lastSeenByMember({
      attendance: [{ clerk_user_id: 'a', event_id: 'e1' }],
      going: [
        { clerk_user_id: 'a', event_id: 'e2' },
        { clerk_user_id: 'b', event_id: 'e3' },
        { clerk_user_id: 'c', event_id: 'e1' },
      ],
      eventStarts,
      nowMs: now,
    });
    expect(seen.get('a')).toBe(Date.parse(eventStarts.get('e2')!));
    expect(seen.has('b')).toBe(false);
    expect(seen.get('c')).toBe(Date.parse(eventStarts.get('e1')!));
  });

  it('lists people not seen for two weeks, but gives newcomers a fortnight', () => {
    const seen = new Map([
      ['a', now - 5 * DAY],
      ['c', now - 20 * DAY],
    ]);
    const members = [
      { userId: 'a', joinedAtMs: now - 100 * DAY },
      { userId: 'b', joinedAtMs: now - 100 * DAY }, // never seen
      { userId: 'c', joinedAtMs: now - 100 * DAY }, // seen 20 days ago
      { userId: 'd', joinedAtMs: now - 3 * DAY }, // new
    ];
    expect(notSeenLately(members, seen, now)).toEqual(['b', 'c']);
  });

  it('nudges at most every fortnight', () => {
    expect(nudgeDue(null, now)).toBe(true);
    expect(nudgeDue(new Date(now - 3 * DAY).toISOString(), now)).toBe(false);
    expect(nudgeDue(new Date(now - (RHYTHM_DAYS + 1) * DAY).toISOString(), now)).toBe(true);
  });
});

describe('quiet questions', () => {
  it('serves one question for a whole week and a different one the next', () => {
    expect(weekOf('2026-01-01')).toBe(1);
    expect(weekKey('2026-09-02')).toBe(weekKey('2026-09-06'));
    expect(weekKey('2026-09-06')).not.toBe(weekKey('2026-09-07'));
    // New Year does not split a week: Thu 2026-12-31 and Fri 2027-01-01 share ISO week 2026-W53.
    expect(weekKey('2026-12-31')).toBe('2026-W53');
    expect(weekKey('2027-01-01')).toBe('2026-W53');
    expect(weekKey('2027-01-04')).toBe('2027-W01');
    expect(weekKey('2028-01-01')).toBe('2027-W52');
    expect(questionForWeek('2026-12-31')).toEqual(questionForWeek('2027-01-01'));
    expect(questionForWeek('2026-09-02')).toEqual(questionForWeek('2026-09-06'));
    expect(questionForWeek('2026-09-06').key).not.toBe(questionForWeek('2026-09-07').key);
    const keys = new Set(QUESTIONS.map((q) => q.key));
    expect(keys.size).toBe(QUESTIONS.length);
  });
});
