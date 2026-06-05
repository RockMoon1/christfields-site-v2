/**
 * ScholarFlow is a CATEGORY, not a single product. It is the shelf where the
 * Christ Fields faith + study tools live. This file is the source of truth for
 * the products on that shelf, rendered by the /scholarflow storefront page and
 * its product cards. Add new products here as they ship.
 *
 * Note on LearnFlow: today it is the deep-study tier that lives inside the
 * GraceFlow app (the "Study" / Omega tab), so its link points into GraceFlow.
 * If it ever gets its own home, just change its `href`.
 */

export interface SFProduct {
  key: string;
  name: string;
  /** One-line hook. */
  tagline: string;
  /** Plain-words description of what it is. */
  description: string;
  /** Who it is for, one line. */
  forWho: string;
  /** A few concrete things you get. */
  features: string[];
  /** Headline price. */
  price: string;
  /** Smaller price note (e.g. a paid tier or yearly option). */
  priceNote?: string;
  /** Short status pill, e.g. "Live now". */
  statusLabel: string;
  /** Where the product actually lives (external). */
  href: string;
  /** Button label. */
  cta: string;
  /** Optional clarifying note under the description. */
  note?: string;
  /** Cursor-glow colour for the card. */
  glow: string;
  /** A short glyph shown in the card's mark. */
  mark: string;
}

export const SCHOLARFLOW_INTRO = {
  eyebrow: 'A category, not a product',
  lead:
    'ScholarFlow is not one app. It is the shelf where our faith and study tools live. You open it to browse the apps we make and pick the one that fits what you need.',
};

export const SCHOLARFLOW_PRODUCTS: SFProduct[] = [
  {
    key: 'graceflow',
    name: 'GraceFlow',
    tagline: 'Scripture for whatever you are facing.',
    description:
      'A faith companion you install on your phone. It meets you in the moment with a real Bible verse, in its true context, plus a short reflection and a prayer.',
    forWho: 'For anyone who wants the right Scripture, right when they need it.',
    features: [
      'A real verse for the moment',
      'The verse in its true context',
      'A short reflection and a prayer',
      'Installs like an app, works offline',
    ],
    price: 'Free',
    priceNote: 'GraceFlow+ from $6.99/mo',
    statusLabel: 'Live now',
    href: 'https://graceflows.netlify.app',
    cta: 'Open GraceFlow',
    glow: 'rgba(201, 165, 72, 0.18)',
    mark: '✦',
  },
  {
    key: 'learnflow',
    name: 'LearnFlow',
    tagline: 'Go deep. The original languages, one tap away.',
    description:
      'The deep-study side of GraceFlow. Tap any word for the original Greek or Hebrew, with cross-references, full context, search, a word concordance, and audio.',
    forWho: 'For students and anyone who wants to study the Word at the source.',
    features: [
      'Tap-a-word Greek and Hebrew',
      "Strong's numbers and lexicon",
      'Cross-references and full context',
      'Word concordance, search, and audio',
    ],
    price: 'From $11.99/mo',
    priceNote: 'or $89.99/yr',
    statusLabel: 'Live now',
    href: 'https://graceflows.netlify.app',
    cta: 'Open LearnFlow',
    note: 'The deep-study tier inside GraceFlow.',
    glow: 'rgba(45, 106, 79, 0.18)',
    mark: 'Ω',
  },
];
