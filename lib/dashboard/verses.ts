import data from './verses.json';
import { bibleUrl } from './bible';
import { themeInfo } from './themes';

/**
 * A different verse every day, and a verse that fits what a member just wrote.
 *
 * verses.json is built once by scripts/build-verses.mjs from the public-domain
 * World English Bible and committed, so nothing is fetched at runtime. Text is
 * kept short on purpose: most of Scripture in this community happens in person.
 */

export interface Verse {
  ref: string;
  text: string;
  tags: string[];
}

export const VERSES: Verse[] = data as Verse[];

/** 1..366 for a YYYY-MM-DD key, computed in UTC so it is the same on every server. */
export function dayOfYear(dayKey: string): number {
  const y = Number(dayKey.slice(0, 4));
  const m = Number(dayKey.slice(5, 7)) - 1;
  const d = Number(dayKey.slice(8, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 1;
  const start = Date.UTC(y, 0, 1);
  return Math.floor((Date.UTC(y, m, d) - start) / 86_400_000) + 1;
}

/** The verse for a calendar day. Consecutive days never repeat within a year. */
export function verseForDay(dayKey: string): Verse {
  if (VERSES.length === 0) return { ref: 'Psalm 118:24', text: 'This is the day that Yahweh has made. We will rejoice and be glad in it!', tags: [] };
  return VERSES[(dayOfYear(dayKey) - 1) % VERSES.length];
}

/** A verse tagged with the theme, rotating daily; falls back to the theme's own passage. */
export function verseForTheme(theme: string, dayKey: string): Verse | null {
  const tagged = VERSES.filter((v) => v.tags.includes(theme));
  if (tagged.length > 0) return tagged[(dayOfYear(dayKey) - 1) % tagged.length];
  const info = themeInfo(theme);
  if (!info) return null;
  return VERSES.find((v) => v.ref === info.passage) ?? { ref: info.passage, text: '', tags: [theme] };
}

export function verseLink(v: Verse): string {
  return bibleUrl(v.ref, 'ESV');
}
