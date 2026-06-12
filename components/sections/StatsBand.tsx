'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { CountUp } from '../motion/CountUp';
import { TextSplit } from '../motion/TextSplit';

/**
 * A band of momentum: a few large figures that count up as they scroll into
 * view. Deliberately NOT vanity metrics (no inflated member counts). These are
 * honest, meaningful figures that say what Christ Fields actually is. Swap in
 * real numbers later by editing the items below.
 *
 * Compressed vertically on purpose — this is a data band, not a chapter —
 * and each value gets its own entrance grammar: numbers count up, the ∞
 * draws itself as a gold lemniscate, and 27:17 rises digit by digit.
 */

interface Stat {
  /** Numeric value to count up to, or null for a static display value. */
  value: number | null;
  display?: string; // used when value is null
  prefix?: string;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 100, suffix: '%', label: 'Known and prayed for by name' },
  { value: 4, label: 'Seasons of growth, from seed to fruit' },
  { value: null, display: '∞', label: 'Mercies, new every morning' },
  { value: null, display: '27:17', label: 'The proverb we are built on' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The ∞ stat's signature entrance: a gold lemniscate strokes itself into
 * being, then dims to a halo as the real ∞ glyph fades in over it. The
 * glyph stays real text (screen readers and copy-paste keep the value);
 * the SVG is pure ornament. Reduced motion renders the settled glyph only.
 */
function InfinityDraw() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <span>∞</span>;
  }

  return (
    <motion.span
      className="relative inline-block"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
    >
      <motion.svg
        aria-hidden
        viewBox="0 0 120 60"
        fill="none"
        className="absolute left-1/2 top-1/2 h-[0.9em] w-auto -translate-x-1/2 -translate-y-1/2 text-gold"
        variants={{
          hidden: { opacity: 1 },
          visible: {
            opacity: 0.3,
            transition: { delay: 1.5, duration: 0.8, ease: EASE },
          },
        }}
      >
        <motion.path
          d="M10 30 C10 12, 48 12, 60 30 C72 48, 110 48, 110 30 C110 12, 72 12, 60 30 C48 48, 10 48, 10 30 Z"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: {
              pathLength: 1,
              transition: { duration: 1.4, ease: EASE },
            },
          }}
        />
      </motion.svg>
      <motion.span
        className="relative"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { delay: 1.2, duration: 0.8, ease: EASE },
          },
        }}
      >
        ∞
      </motion.span>
    </motion.span>
  );
}

export function StatsBand() {
  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(201,165,72,0.05) 0%, transparent 60%)',
        }}
      />
      <Container>
        {/* Eyebrow with the family's drawn-rule entrance (no heading — data band). */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.9, ease: EASE }}
            style={{ transformOrigin: 'right center' }}
            className="h-px w-8 bg-gradient-to-r from-transparent to-gold/70"
          />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
            className="font-display text-xs font-medium uppercase tracking-[0.22em] text-gold"
          >
            What this actually is
          </motion.p>
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.9, ease: EASE }}
            style={{ transformOrigin: 'left center' }}
            className="h-px w-8 bg-gradient-to-l from-transparent to-gold/70"
          />
        </div>

        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-y-0">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="relative px-4 text-center">
              <Reveal delay={i * 0.08}>
                <p className="font-display text-5xl font-light leading-none text-gold-lt md:text-6xl">
                  {stat.value !== null ? (
                    <CountUp to={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  ) : stat.display === '∞' ? (
                    <InfinityDraw />
                  ) : (
                    <TextSplit text={stat.display ?? ''} by="char" mask blur={false} stagger={0.07} />
                  )}
                </p>
                <p className="mx-auto mt-4 max-w-[14rem] text-sm leading-relaxed text-silver">
                  {stat.label}
                </p>
              </Reveal>

              {/* Dividers draw themselves in vertically, staggered left to right. */}
              {i < STATS.length - 1 && (
                <motion.span
                  aria-hidden
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.25 + i * 0.18 }}
                  style={{ transformOrigin: 'top center' }}
                  className="absolute bottom-1 right-0 top-1 hidden w-px bg-border-sub/60 md:block"
                />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
