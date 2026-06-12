'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';

/**
 * A cinematic band of Scripture, two rows drifting in opposite directions.
 *
 * Two motions are layered:
 *  - a continuous CSS slide (the .cf-marquee classes in globals.css) so the
 *    verses are always visibly moving, and
 *  - a scroll-linked slide on the wrapper: as you scroll the page, the rows
 *    push further sideways and reveal more verses.
 *
 * Edge-faded so phrases emerge and dissolve. The CSS animation auto-stops under
 * prefers-reduced-motion; the scroll slide is gated here too. Pure ornament.
 *
 * The verse set is themeable per page: the home band speaks broadly, while
 * FaithFlow gets community scriptures and ScholarFlow gets wisdom/skill ones,
 * so each page's band carries that page's heart. Defaults stay the home set.
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

function Row({
  items,
  direction,
  scrollX,
}: {
  items: string[];
  direction: 'left' | 'right';
  scrollX: MotionValue<string>;
}) {
  // Duplicate the track so the CSS -50% slide loops seamlessly.
  const track = [...items, ...items];

  return (
    <div className="flex overflow-hidden">
      {/* Outer wrapper: scroll-linked sideways slide. */}
      <motion.div style={{ x: scrollX }} className="flex">
        {/* Inner track: continuous CSS slide (always moving). */}
        <div
          className={`flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 md:gap-16 md:pr-16 ${
            direction === 'left' ? 'cf-marquee' : 'cf-marquee-reverse'
          }`}
        >
          {track.map((item, i) => {
            const isRef = /\d/.test(item);
            return (
              <span key={`${item}-${i}`} className="flex items-center gap-10 md:gap-16">
                <span
                  className={
                    isRef
                      ? 'font-display text-2xl font-light italic text-gold/70 md:text-4xl'
                      : 'font-display text-2xl font-light text-ivory/85 md:text-4xl'
                  }
                >
                  {item}
                </span>
                <span aria-hidden className="text-gold/40">
                  &bull;
                </span>
              </span>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export function ScriptureMarquee({
  lineOne = LINE_ONE,
  lineTwo = LINE_TWO,
}: {
  /** Alternating phrase/reference pairs for the top row. */
  lineOne?: string[];
  /** Alternating phrase/reference pairs for the bottom row. */
  lineTwo?: string[];
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Opposite-direction sideways slides driven by scroll. Generous range so the
  // scroll clearly whips the verses across. Disabled under reduced-motion.
  const xOne = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['18%', '-18%']);
  const xTwo = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['-18%', '18%']);

  return (
    <section
      ref={ref}
      aria-hidden
      className="relative overflow-hidden border-y border-border-sub/60 bg-black-2 py-10 md:py-14"
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div className="flex flex-col gap-5 md:gap-7">
        <Row items={lineOne} direction="left" scrollX={xOne} />
        <Row items={lineTwo} direction="right" scrollX={xTwo} />
      </div>
    </section>
  );
}
