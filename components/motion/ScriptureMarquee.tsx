'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * A slow, cinematic band of Scripture that drifts horizontally, two rows moving
 * in opposite directions. Edge-faded so phrases emerge and dissolve rather than
 * hard-cut. Honors reduced-motion (renders a calm static band instead).
 *
 * Pure ornament: aria-hidden, no interactivity, on-brand gold/ivory.
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
  reduced,
}: {
  items: string[];
  direction: 'left' | 'right';
  reduced: boolean;
}) {
  // Duplicate the track so the loop is seamless (animate by exactly one copy).
  const track = [...items, ...items];
  const from = direction === 'left' ? '0%' : '-50%';
  const to = direction === 'left' ? '-50%' : '0%';

  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 md:gap-16 md:pr-16"
        initial={false}
        animate={reduced ? {} : { x: [from, to] }}
        transition={{ duration: 42, ease: 'linear', repeat: Infinity }}
      >
        {track.map((item, i) => {
          const isRef = /\d/.test(item); // references carry a number
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
      </motion.div>
    </div>
  );
}

export function ScriptureMarquee() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-hidden
      className="relative overflow-hidden border-y border-border-sub/60 bg-black-2 py-10 md:py-14"
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div className="flex flex-col gap-5 md:gap-7">
        <Row items={LINE_ONE} direction="left" reduced={!!reduced} />
        <Row items={LINE_TWO} direction="right" reduced={!!reduced} />
      </div>
    </section>
  );
}
