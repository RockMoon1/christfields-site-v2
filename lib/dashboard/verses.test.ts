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
    // A whole year with no repeats, two years running, and the years differ from each other.
    const byYear: Set<string>[] = [];
    for (const year of [2027, 2028]) {
      const seen = new Set<string>();
      const days = year === 2028 ? 366 : 365;
      for (let d = 1; d <= days; d += 1) {
        const date = new Date(Date.UTC(year, 0, d)).toISOString().slice(0, 10);
        seen.add(verseForDay(date).ref);
      }
      expect(seen.size).toBe(days);
      byYear.push(seen);
    }
    expect(verseForDay('2027-03-01').ref).not.toBe(verseForDay('2028-03-01').ref);
    expect(byYear.length).toBe(2);
  });

  it('finds a verse with words for every theme, deterministically', () => {
    for (const t of THEMES) {
      const v = verseForTheme(t.key, '2026-09-04');
      expect(v).not.toBeNull();
      expect(v?.ref.length).toBeGreaterThan(3);
      expect(v?.text.length ?? 0).toBeGreaterThan(10);
      expect(verseForTheme(t.key, '2026-09-04')?.ref).toBe(v?.ref);
    }
    expect(verseForTheme('not-a-theme', '2026-09-04')).toBeNull();
  });

  it('tags are not scripture noise', () => {
    const john316 = VERSES.find((v) => v.ref === 'John 3:16');
    expect(john316?.tags ?? []).not.toContain('parenting');
    const psalm23 = VERSES.find((v) => v.ref === 'Psalm 23:1-3');
    expect(psalm23).toBeDefined();
    expect(psalm23?.tags ?? []).not.toContain('honesty');
  });
});
