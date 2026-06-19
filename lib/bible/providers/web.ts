import type { BibleProvider, BibleVerse } from '../types';

/**
 * World English Bible (WEB) — a modern, readable, PUBLIC DOMAIN translation.
 * No license, no attribution legally required, safe for any use (including
 * commercial). Text is served by bible-api.com (open source, https only),
 * called SERVER-SIDE and cached in memory so repeat lookups cost nothing and we
 * stay well under its rate limit.
 *
 * This is FaithFlow's bulletproof default source: it never depends on a vendor's
 * commercial terms. If/when the YouVersion app is approved, that provider takes
 * over for richer translations and WEB stays as the always-available fallback.
 *
 * (For full vendor-independence later, swap the fetch for a self-hosted WEB
 * dataset committed to the repo — the rest of this layer stays the same.)
 */

const cache = new Map<string, BibleVerse>();

export const webProvider: BibleProvider = {
  id: 'web',
  translation: 'WEB',

  async lookup(reference: string): Promise<BibleVerse | null> {
    const ref = reference.trim();
    if (ref.length < 2) return null;

    const key = ref.toLowerCase();
    const hit = cache.get(key);
    if (hit) return hit;

    try {
      const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=web`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        reference?: string;
        text?: string;
        translation_name?: string;
      };
      const text = String(data.text ?? '').replace(/\s+/g, ' ').trim();
      if (!text) return null;

      const verse: BibleVerse = {
        reference: String(data.reference ?? ref).trim(),
        text,
        translation: 'WEB',
        translationName: data.translation_name || 'World English Bible (public domain)',
      };

      if (cache.size > 2000) cache.clear();
      cache.set(key, verse);
      return verse;
    } catch {
      return null;
    }
  },
};
