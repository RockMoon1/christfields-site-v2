/**
 * One place for "open this passage". BibleGateway needs no key and no licence
 * for a link. Verse TEXT shown inside the app comes from the public-domain
 * World English Bible (lib/dashboard/verses.json); the ESV link sits beside it.
 */
export function bibleUrl(ref: string, version: string = 'ESV'): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref.trim())}&version=${encodeURIComponent(version)}`;
}

/** "Romans 12:1-2" style references only; anything else is left blank. */
export function cleanReference(raw: string): string {
  const s = raw.replace(/\s+/g, ' ').trim().slice(0, 60);
  return /^[1-3]?\s?[A-Za-z][A-Za-z .]{1,30}\s\d{1,3}(?::\d{1,3}(?:[-–]\d{1,3})?)?(?:[-–]\d{1,3}(?::\d{1,3})?)?$/.test(s) ? s : '';
}
