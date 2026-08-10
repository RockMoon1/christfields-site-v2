'use client';

import { motion, useScroll, useTransform, type Variants } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { Reveal } from '../Reveal';
import { Button } from '../Button';
import { TextSplit } from '../motion/TextSplit';
import { HeroSpotlight } from '../motion/HeroSpotlight';

// Stagger config for the hero heading. The container delays children one by
// one; each word rises out of its own overflow-hidden mask — a letterpress
// wipe rather than a blur-fade, so the type arrives with weight.
const parent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const word: Variants = {
  hidden: { y: '120%' },
  visible: {
    y: '0%',
    transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * One masked word of the H1: an overflow-hidden clip the word rises out of.
 * Bottom padding (with a compensating negative margin) keeps descenders
 * unclipped at the tight display leading. Inherits the parent's variant
 * timeline, so the stagger choreography lives in one place.
 */
function MaskedWord({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
      <motion.span variants={word} className={`inline-block will-change-transform ${className}`}>
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Home page hero. Ports the v1 hero copy and structure exactly.
 * The "Iron." in the heading is upright gold as before, and catches a
 * one-shot shimmer (.cf-em-shimmer) after the heading settles. Heading is
 * pushed to full editorial scale; the Proverbs 27:17 verse line arrives
 * word by word after the heading lands.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  // Background glows drift up at different rates as you scroll past the hero.
  // Top glow moves up faster, bottom glow moves slower, creating depth.
  // Distances tuned so the parallax reads clearly even on short scrolls.
  const topGlowY = useTransform(scrollY, [0, 800], [0, -340]);
  const bottomGlowY = useTransform(scrollY, [0, 800], [0, -160]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0.3]);
  // The hero content recedes slightly as you scroll past, for cinematic depth.
  // (Transform/opacity only; no scroll-driven blur, which janks on weak devices.)
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.94]);

  return (
    <section
      ref={ref}
      id="home"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-7 pt-[var(--nav-h)]"
    >
      {/* Background atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 50% 28%, rgba(201, 165, 72, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(27, 67, 50, 0.18) 0%, transparent 60%),
            #060908
          `,
        }}
      />
      <motion.div
        aria-hidden
        style={{ y: topGlowY }}
        className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-96 w-[120%] -translate-x-1/2 bg-gold/[0.04] blur-3xl"
      />
      <motion.div
        aria-hidden
        style={{ y: bottomGlowY }}
        className="pointer-events-none absolute -bottom-20 left-1/2 -z-10 h-96 w-[120%] -translate-x-1/2 bg-emerald/[0.06] blur-3xl"
      />

      {/* Breathing aura behind the headline, for depth and life. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(201,165,72,0.10) 0%, rgba(201,165,72,0.04) 35%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Film grain for a premium, textured finish. Very subtle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* One-time light sweep across the hero on load, for a theatrical entrance. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.7, delay: 0.3, times: [0, 0.45, 1], ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute -inset-y-16 w-1/3 blur-2xl"
          style={{
            background:
              'linear-gradient(100deg, transparent, rgba(228,201,122,0.22), transparent)',
          }}
          initial={{ x: '-140%' }}
          animate={{ x: '160%' }}
          transition={{ duration: 1.5, delay: 0.35, ease: [0.5, 0, 0.2, 1] }}
        />
      </motion.div>

      {/* Cursor-following gold spotlight */}
      <HeroSpotlight />

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 mx-auto max-w-5xl text-center"
      >
        <Reveal>
          <p className="mb-6 font-display text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Proverbs 27:17
          </p>
        </Reveal>

        {/* Word-by-word masked rise at full editorial scale */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={parent}
          className="mb-6 font-display text-[clamp(3.4rem,9vw,7.5rem)] font-light leading-[0.98] tracking-[-0.01em] text-ivory"
        >
          <MaskedWord>Iron</MaskedWord> <MaskedWord>Sharpens</MaskedWord>
          <br />
          <MaskedWord className="cf-em-shimmer not-italic text-gold-lt">Iron.</MaskedWord>
        </motion.h1>

        <Reveal delay={0.55}>
          <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-ivory-dim md:text-xl">
            A Christian community, and the tools to actually walk it out together. Grow with people
            who know your name, stay close to God, and sharpen each other along the way.
          </p>
        </Reveal>

        {/* The verse arrives word by word, at reading pace, after the heading. */}
        <p className="mb-10 font-display text-base italic text-silver md:text-lg">
          <TextSplit
            text={'“As iron sharpens iron, so one person sharpens another.”'}
            by="word"
            blur={false}
            delay={0.9}
          />
        </p>

        <Reveal delay={1.2}>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/scholarflow" variant="primary">
              Discover ScholarFlow{' '}
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                &rarr;
              </span>
            </Button>
            <Button href="#vision" variant="ghost">
              Our Vision
            </Button>
          </div>
        </Reveal>
      </motion.div>

      {/* Scroll indicator */}
      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.3em] text-muted"
      >
        <p className="mb-2">Scroll</p>
        <div className="scroll-line mx-auto h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}
