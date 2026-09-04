import data from './themes.json';

/**
 * Turning private words into a theme a leader may see, without any of the
 * words leaving the server or an outside model ever reading them.
 *
 * A deterministic lexicon of about thirty themes. Each theme has whole-word
 * matches and short phrases; the score is the number of hits; the top two
 * themes are offered to the member, who confirms or corrects. Safety patterns
 * (self-harm, suicide, being harmed) are matched separately and NEVER become a
 * theme: they trigger the care card and a private note to the leaders instead.
 */

export interface ThemeInfo {
  key: string;
  label: string;
  /** A passage a leader might turn to. Also used to pick the member's verse. */
  passage: string;
  /** One line for the leader, never shown to members. */
  nudge: string;
}

interface Lexicon {
  safety: { phrases: string[] };
  themes: Record<string, { label: string; words: string[]; phrases: string[]; passage: string; nudge: string }>;
}

const LEX = data as Lexicon;

export const THEMES: ThemeInfo[] = Object.entries(LEX.themes).map(([key, t]) => ({
  key,
  label: t.label,
  passage: t.passage,
  nudge: t.nudge,
}));

const THEME_BY_KEY = new Map(THEMES.map((t) => [t.key, t]));

export function themeInfo(key: string): ThemeInfo | null {
  return THEME_BY_KEY.get(key) ?? null;
}

export function isThemeKey(v: unknown): v is string {
  return typeof v === 'string' && THEME_BY_KEY.has(v);
}

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ')} `;
}

const WORD_RE = new Map<string, RegExp>();
function wordRe(word: string): RegExp {
  let re = WORD_RE.get(word);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-z0-9])`, 'g');
    WORD_RE.set(word, re);
  }
  return re;
}

function count(hay: string, needle: RegExp): number {
  needle.lastIndex = 0;
  let n = 0;
  while (needle.exec(hay)) n += 1;
  return n;
}

export interface ThemeMatch {
  /** Up to two theme keys, strongest first. Empty when nothing matched. */
  themes: string[];
  /** True when a crisis pattern matched. Handled apart from themes. */
  safety: boolean;
}

export function matchThemes(text: string): ThemeMatch {
  const hay = normalize(text || '');
  // Same whole-word matcher as the themes: "draped" and "scraped" are not "raped".
  const safety = LEX.safety.phrases.some((p) => count(hay, wordRe(p.toLowerCase())) > 0);
  const scored: { key: string; score: number }[] = [];
  for (const [key, t] of Object.entries(LEX.themes)) {
    let score = 0;
    for (const w of t.words) score += count(hay, wordRe(w.toLowerCase()));
    for (const p of t.phrases) score += count(hay, wordRe(p.toLowerCase()));
    if (score > 0) scored.push({ key, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return { themes: scored.slice(0, 2).map((s) => s.key), safety };
}

/** Themes tagged onto a verse: same lexicon, so member themes and verse tags agree. */
export function tagText(text: string): string[] {
  return matchThemes(text).themes;
}
