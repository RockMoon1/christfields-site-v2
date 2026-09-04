import { describe, expect, it } from 'vitest';
import { matchThemes, THEMES, themeInfo } from './themes';

describe('theme matching', () => {
  it('hears what was actually said', () => {
    expect(matchThemes('I keep lying to my wife about money.').themes.slice(0, 2)).toEqual(expect.arrayContaining(['honesty']));
    expect(matchThemes('I keep lying to my wife about money.').themes).not.toContain('anxiety');
    expect(matchThemes("I can't sleep, I'm worrying about everything.").themes[0]).toBe('anxiety');
    expect(matchThemes('My dad and I have not spoken since Christmas.').themes[0]).toBe('family');
    expect(matchThemes('Lost my job Friday and the bills are due.').themes).toEqual(expect.arrayContaining(['work', 'money']));
    expect(matchThemes('So grateful this week, God answered prayer.').themes[0]).toBe('gratitude');
  });

  it('does not fire on ordinary words', () => {
    expect(matchThemes('Looking forward to Thursday. Bringing drinks.').themes).toEqual([]);
    expect(matchThemes('It hit me that I should call my grandma more.').safety).toBe(false);
    expect(matchThemes('Work was fine, nothing much to report.').themes).toEqual([]);
  });

  it('flags safety separately and never as a theme', () => {
    const m = matchThemes('Some days I want to die and I have thought about ending it all.');
    expect(m.safety).toBe(true);
    expect(m.themes).not.toContain('safety');
    expect(matchThemes('He hits me when he drinks.').safety).toBe(true);
    expect(matchThemes('The sermon really hit me this week.').safety).toBe(false);
  });

  it('caps at two themes and every theme has a passage and a nudge', () => {
    expect(matchThemes('Lonely, anxious, angry, ashamed, broke.').themes.length).toBeLessThanOrEqual(2);
    for (const t of THEMES) {
      expect(t.passage.length).toBeGreaterThan(3);
      expect(t.nudge.length).toBeGreaterThan(10);
      expect(themeInfo(t.key)?.label).toBe(t.label);
    }
  });
});
