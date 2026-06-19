export interface BibleVerse {
  /** Normalized reference as returned by the source, e.g. "John 3:16". */
  reference: string;
  /** Clean, single-spaced verse or passage text. */
  text: string;
  /** Short translation code, e.g. "WEB" or "NIV". */
  translation: string;
  /** Human-readable translation name, when known. */
  translationName?: string;
}

export interface BibleProvider {
  /** Stable id for selection / fallback logic. */
  readonly id: string;
  /** The translation this provider serves. */
  readonly translation: string;
  /** Look up a reference (e.g. "John 3:16"). Returns null if not found or on error. */
  lookup(reference: string): Promise<BibleVerse | null>;
}
