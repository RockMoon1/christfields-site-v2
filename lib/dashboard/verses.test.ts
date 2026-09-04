import { describe, expect, it } from 'vitest';
import { VERSES, dayOfYear, verseForDay, verseForTheme } from './verses';
import { THEMES } from './themes';

describe('verse of the day', () => {
  it('has a verse for every day of a leap year', () => {
    expect(VERSES.length).toBeGreaterThanOrEqual(366);
    for (const v of VERSES) {
      expect(v.ref.length).toBeGreaterThan(3);
      expect(v.text.length).toBeGreaterThan(10);
    }
  });

  it('counts days of the year', () => {
    expect(dayOfYear('2026-01-01')).toBe(1);
    expect(dayOfYear('2026-12-31')).toBe(365);
    expect(dayOfYear('2028-12-31')).toBe(366);
  });

  it('is the same verse all day and a different one tomorrow', () => {
    expect(verseForDay('2026-09-04')).toEqual(verseForDay('2026-09-04'));
    expect(verseForDay('2026-09-04').ref).not.toBe(verseForDay('2026-09-05').ref);
    // A whole year with no repeats.
    const seen = new Set<string>();
    for (let d = 1; d <= 366; d += 1) {
      const date = new Date(Date.UTC(2028, 0, d)).toISOString().slice(0, 10);
      seen.add(verseForDay(date).ref);
    }
    expect(seen.size).toBe(366);
  });

  it('finds a verse for every theme, deterministically', () => {
    for (const t of THEMES) {
      const v = verseForTheme(t.key, '2026-09-04');
      expect(v).not.toBeNull();
      expect(v?.ref.length).toBeGreaterThan(3);
      expect(verseForTheme(t.key, '2026-09-04')?.ref).toBe(v?.ref);
    }
    expect(verseForTheme('not-a-theme', '2026-09-04')).toBeNull();
  });
});
