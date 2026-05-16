'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Reveal } from '../../Reveal';
import { HeroSpotlight } from '../../motion/HeroSpotlight';
import { MagneticButton } from '../../motion/MagneticButton';

const parent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
};

const word: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

export function FFHero() {
  return (
    <section className="relative z-[2] flex min-h-[92vh] items-center justify-center overflow-hidden px-7 pt-[var(--nav-h)]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 50% 28%, rgba(201, 165, 72, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(45, 106, 79, 0.20) 0%, transparent 60%),
            #060908
          `,
        }}
      />

      {/* Cursor-following gold spotlight */}
      <HeroSpotlight />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Reveal>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-lt/35 bg-emerald-lt/15 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-lt">
            <span className="inline-block h-1.5 w-1.5 animate-[ffPulse_2s_ease-in-out_infinite] rounded-full bg-emerald-lt shadow-[0_0_8px_var(--color-emerald-lt)]" />
            First Group Active
          </span>
        </Reveal>

        {/* Word-by-word reveal. "Faith" then "Flow." with the gold ignition. */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={parent}
          className="mb-6 font-display text-[clamp(3.4rem,7vw,5.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-ivory"
        >
          <motion.span variants={word} className="inline-block">Faith</motion.span>
          <motion.span variants={word} className="inline-block not-italic text-gold-lt">
            Flow.
          </motion.span>
        </motion.h1>

        <Reveal delay={0.7}>
          <p className="mx-auto mb-6 max-w-xl text-lg leading-relaxed text-ivory-dim md:text-xl">
            Real community. Scripture-rooted accountability. Faith lived together.
          </p>
        </Reveal>

        <Reveal delay={0.8}>
          <p className="mb-10 font-display text-base italic text-silver md:text-lg">
            &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
          </p>
        </Reveal>

        <Reveal delay={0.9}>
          <div className="flex flex-wrap justify-center gap-3">
            <MagneticButton>
              <Link
                href="#get-involved"
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
              >
                Join or Learn More &rarr;
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="#groups"
                className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                View Active Groups
              </Link>
            </MagneticButton>
          </div>
        </Reveal>
      </div>

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
