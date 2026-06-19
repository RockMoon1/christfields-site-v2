import type { BibleProvider, BibleVerse } from '../types';

/**
 * YouVersion Platform provider (CONTENT-ONLY — no "Sign in with YouVersion";
 * FaithFlow already authenticates members with Clerk).
 *
 * INACTIVE until the FaithFlow app is approved and these env vars are set:
 *   YOUVERSION_APP_KEY      the Platform app key (sent as the X-YVP-App-Key header)
 *   YOUVERSION_VERSION_ID   the numeric Bible version id to read (e.g. the NIV)
 *   YOUVERSION_TRANSLATION  short label to display, e.g. "NIV" (optional)
 *
 * When the key is absent this provider is null and FaithFlow uses the public
 * domain WEB source. To finish the drop-in once approved: implement lookup()
 * against the Platform "passages" endpoint (request `format=text` — it returns
 * HTML by default), map the result to a BibleVerse, and confirm the exact base
 * URL / path against the developer portal docs (which you'll have once in).
 * Any failure here falls back to WEB automatically (see ../index.ts), so a
 * half-finished or misconfigured integration can never break the feature.
 */

const APP_KEY = process.env.YOUVERSION_APP_KEY;
const TRANSLATION = process.env.YOUVERSION_TRANSLATION || 'NIV';

let warned = false;

export const youVersionProvider: BibleProvider | null = APP_KEY
  ? {
      id: 'youversion',
      translation: TRANSLATION,
      async lookup(_reference: string): Promise<BibleVerse | null> {
        // DROP-IN POINT: call the YouVersion Platform passages endpoint here with
        // the `X-YVP-App-Key: ${APP_KEY}` header and `format=text`, then return a
        // BibleVerse. Until then we warn once and fall back to WEB.
        if (!warned) {
          warned = true;
          console.warn(
            'YOUVERSION_APP_KEY is set but the YouVersion provider is not wired yet; ' +
              'falling back to the World English Bible. Implement lib/bible/providers/youversion.ts.',
          );
        }
        return null;
      },
    }
  : null;
