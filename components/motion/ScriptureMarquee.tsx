'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';

/**
 * A cinematic band of Scripture, two rows drifting in opposite directions.
 *
 * Two motions are layered:
 *  - a slow, continuous idle drift so it always feels alive, and
 *  - a scroll-linked slide: as you scroll the page, the rows move sideways and
 *    reveal more verses (the outer wrapper is driven by scroll progress).
 *
 * Edge-faded so phrases emerge and dissolve. Honors reduced-motion (renders a
 * calm, still band). Pure ornament: aria-hidden, on-brand gold/ivory.
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
  reduced,
}: {
  items: string[];
  direction: 'left' | 'right';
  scrollX: MotionValue<string>;
  reduced: boolean;
}) {
  // Duplicate the track so the idle loop is seamless (animate by one full copy).
  const track = [...items, ...items];
  const from = direction === 'left' ? '0%' : '-50%';
  const to = direction === 'left' ? '-50%' : '0%';

  return (
    <div className="flex overflow-hidden">
      {/* Outer wrapper: scroll-linked sideways slide. */}
      <motion.div style={{ x: scrollX }} className="flex">
        {/* Inner track: continuous idle drift. */}
        <motion.div
          className="flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 md:gap-16 md:pr-16"
          animate={reduced ? {} : { x: [from, to] }}
          transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
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
        </motion.div>
      </motion.div>
    </div>
  );
}

export function ScriptureMarquee() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // Track the band as it travels through the viewport. 0 when it enters the
  // bottom, 1 when it leaves the top.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Opposite-direction sideways slides driven by scroll. Reduced-motion users
  // get a fixed offset (no movement).
  const xOne = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['12%', '-12%']);
  const xTwo = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['-12%', '12%']);

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
        <Row items={LINE_ONE} direction="left" scrollX={xOne} reduced={!!reduced} />
        <Row items={LINE_TWO} direction="right" scrollX={xTwo} reduced={!!reduced} />
      </div>
    </section>
  );
}
