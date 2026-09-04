import { describe, expect, it } from 'vitest';
import { memberIsFree, slotForLocalHour, weeklyKey, overrideKey } from './availability';

const day = { iso: '2026-09-10', weekday: 4 }; // a Thursday

describe('memberIsFree', () => {
  it('a member with a weekly pattern is free only where the pattern says, minus busy blocks', () => {
    const m = {
      weekly: new Set([weeklyKey(4, 'evening')]),
      overrides: new Map<string, boolean>(),
      busy: new Set<string>(),
      hasCalendarSource: false,
    };
    expect(memberIsFree(day.iso, day.weekday, 'evening', m)).toBe(true);
    expect(memberIsFree(day.iso, day.weekday, 'morning', m)).toBe(false);
    m.busy.add(overrideKey(day.iso, 'evening'));
    expect(memberIsFree(day.iso, day.weekday, 'evening', m)).toBe(false);
  });

  it('a member who only connected a calendar is free wherever it is not busy', () => {
    const m = {
      weekly: new Set<string>(),
      overrides: new Map<string, boolean>(),
      busy: new Set([overrideKey(day.iso, 'evening')]),
      hasCalendarSource: true,
    };
    expect(memberIsFree(day.iso, day.weekday, 'morning', m)).toBe(true);
    expect(memberIsFree(day.iso, day.weekday, 'evening', m)).toBe(false);
  });

  it('a member who told us nothing is never free', () => {
    const m = { weekly: new Set<string>(), overrides: new Map<string, boolean>(), busy: new Set<string>(), hasCalendarSource: false };
    expect(memberIsFree(day.iso, day.weekday, 'morning', m)).toBe(false);
  });

  it('a date override wins over everything', () => {
    const m = {
      weekly: new Set<string>(),
      overrides: new Map([[overrideKey(day.iso, 'evening'), true]]),
      busy: new Set([overrideKey(day.iso, 'evening')]),
      hasCalendarSource: false,
    };
    expect(memberIsFree(day.iso, day.weekday, 'evening', m)).toBe(true);
  });
});

describe('slotForLocalHour', () => {
  it('buckets the day into three slots and leaves the night out', () => {
    expect(slotForLocalHour(7)).toBe('morning');
    expect(slotForLocalHour(12)).toBe('afternoon');
    expect(slotForLocalHour(19)).toBe('evening');
    expect(slotForLocalHour(23)).toBeNull();
    expect(slotForLocalHour(2)).toBeNull();
  });
});
