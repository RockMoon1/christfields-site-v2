import type { BibleVerse } from './types';
import { webProvider } from './providers/web';
import { youVersionProvider } from './providers/youversion';

export type { BibleVerse } from './types';

/**
 * FaithFlow's Bible source layer. Returns accurate, properly-licensed verse text
 * for a reference like "John 3:16". SERVER-ONLY.
 *
 * Source order: the YouVersion Platform provider when it is configured and
 * approved (richer translations like the NIV), otherwise the public-domain
 * World English Bible. The WEB source is ALWAYS used as a fallback, so a single
 * vendor's availability or terms can never take the feature down.
 */
const primary = youVersionProvider ?? webProvider;

export async function lookupVerse(reference: string): Promise<BibleVerse | null> {
  const ref = (reference ?? '').trim().slice(0, 120);
  if (ref.length < 2) return null;

  const fromPrimary = await primary.lookup(ref);
  if (fromPrimary) return fromPrimary;

  // Fall back to the always-available public-domain source.
  if (primary.id !== webProvider.id) {
    return webProvider.lookup(ref);
  }
  return null;
}
