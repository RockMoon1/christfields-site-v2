import { Container } from '../Container';

/**
 * Static, selectable reading band. Keep the legacy export and paired-array
 * props so the home, FaithFlow, and ScholarFlow pages retain their exact copy.
 * Wording and references are not verified or rewritten by this presentation
 * component; quotation and edition review remain a separate, gated task.
 */

const LINE_ONE = [
  'Iron sharpens iron',
  'Proverbs 27:17',
  'Be still, and know',
  'Psalm 46:10',
  'Come to me, and rest',
  'Matthew 11:28',
  'His mercies are new every morning',
  'Lamentations 3:23',
];

const LINE_TWO = [
  'Your word, a lamp to my feet',
  'Psalm 119:105',
  'No condemnation in Christ',
  'Romans 8:1',
  'Bear one another’s burdens',
  'Galatians 6:2',
  'He rejoices over you',
  'Zephaniah 3:17',
];

function pairPhrases(items: string[]) {
  const pairs: { phrase: string; reference?: string }[] = [];
  for (let i = 0; i < items.length; i += 2) {
    // Keep an unmatched final phrase visible instead of silently dropping it.
    pairs.push({ phrase: items[i], reference: items[i + 1] });
  }
  return pairs;
}

export function ScriptureMarquee({
  lineOne = LINE_ONE,
  lineTwo = LINE_TWO,
}: {
  /** Alternating phrase/reference pairs, rendered first in source order. */
  lineOne?: string[];
  /** Alternating phrase/reference pairs, rendered after lineOne. */
  lineTwo?: string[];
}) {
  const phrases = [...pairPhrases(lineOne), ...pairPhrases(lineTwo)];

  return (
    <section
      aria-label="Scripture"
      data-scripture-band=""
      className="select-text border-y border-border-sub bg-black-2 py-12 md:py-16"
    >
      <Container>
        <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {phrases.map(({ phrase, reference }, index) => (
            <figure key={`${phrase}-${reference ?? ''}-${index}`} className="m-0 flex min-w-0 flex-col items-start">
              <blockquote className="max-w-[26ch] flex-1">
                <p className="font-display text-2xl font-light leading-snug text-ivory">{phrase}</p>
              </blockquote>
              {reference !== undefined && (
                <figcaption className="mt-3 font-body text-meta font-medium uppercase tracking-[0.18em] text-gold">
                  {reference}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
