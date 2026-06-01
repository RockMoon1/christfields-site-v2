'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants } from 'motion/react';
import { useRef } from 'react';
import { Reveal } from '../Reveal';
import { HeroSpotlight } from '../motion/HeroSpotlight';
import { MagneticButton } from '../motion/MagneticButton';

// Stagger config for the hero heading. The container delays children one by
// one; each child rises and fades in.
const parent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const word: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Home page hero. Ports the v1 hero copy and structure exactly.
 * The "Iron." in the heading is italic gold as before.
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
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.94]);
  const heroBlur = useTransform(scrollY, [0, 600], ['blur(0px)', 'blur(3px)']);

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

      {/* Cursor-following gold spotlight */}
      <HeroSpotlight />

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, filter: heroBlur }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <Reveal>
          <p className="mb-6 font-display text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Proverbs 27:17
          </p>
        </Reveal>

        {/* Word-by-word stagger reveal */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={parent}
          className="mb-6 font-display text-[clamp(3.2rem,7vw,5.75rem)] font-light leading-[1.05] text-ivory"
        >
          <motion.span variants={word} className="inline-block">Iron</motion.span>{' '}
          <motion.span variants={word} className="inline-block">Sharpens</motion.span>
          <br />
          <motion.span variants={word} className="inline-block not-italic text-gold-lt">
            Iron.
          </motion.span>
        </motion.h1>

        <Reveal delay={0.5}>
          <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-ivory-dim md:text-xl">
            Christ Fields is a technology company rooted in Christian faith, building tools and
            communities for people who want to live and work with wisdom, integrity, and faithfulness.
          </p>
        </Reveal>

        <Reveal delay={0.6}>
          <p className="mb-10 font-display text-base italic text-silver md:text-lg">
            &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
          </p>
        </Reveal>

        <Reveal delay={0.7}>
          <div className="flex flex-wrap justify-center gap-3">
            <MagneticButton>
              <Link
                href="#scholarflow"
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
              >
                Discover ScholarFlow &rarr;
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="#vision"
                className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Our Vision
              </Link>
            </MagneticButton>
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
