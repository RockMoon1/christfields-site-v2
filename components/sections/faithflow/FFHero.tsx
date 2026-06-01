'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { Reveal } from '../../Reveal';
import { HeroSpotlight } from '../../motion/HeroSpotlight';
import { MagneticButton } from '../../motion/MagneticButton';
import { TextSplit } from '../../motion/TextSplit';

export function FFHero() {
  const { scrollY } = useScroll();
  // Parallax tuned so the background visibly drifts as you scroll past
  // the hero. Combined with the content fade, this creates real depth.
  const bgY = useTransform(scrollY, [0, 800], [0, -260]);
  const contentOpacity = useTransform(scrollY, [0, 600], [1, 0.3]);

  return (
    <section
      id="top"
      className="relative z-[2] flex min-h-[92vh] items-center justify-center overflow-hidden px-7 pt-[var(--nav-h)]"
    >
      <motion.div
        aria-hidden
        style={{
          y: bgY,
          background: `
            radial-gradient(ellipse at 50% 28%, rgba(201, 165, 72, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(45, 106, 79, 0.20) 0%, transparent 60%),
            #060908
          `,
        }}
        className="absolute inset-0 -z-10"
      />

      {/* Breathing aura behind the headline. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(45,106,79,0.14) 0%, rgba(201,165,72,0.05) 40%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* One-time light sweep on load, for a theatrical entrance. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.7, delay: 0.3, times: [0, 0.45, 1], ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute -inset-y-16 w-1/3 blur-2xl"
          style={{ background: 'linear-gradient(100deg, transparent, rgba(228,201,122,0.20), transparent)' }}
          initial={{ x: '-140%' }}
          animate={{ x: '160%' }}
          transition={{ duration: 1.5, delay: 0.35, ease: [0.5, 0, 0.2, 1] }}
        />
      </motion.div>

      {/* Cursor-following gold spotlight */}
      <HeroSpotlight />

      <motion.div style={{ opacity: contentOpacity }} className="relative z-10 mx-auto max-w-3xl text-center">
        <Reveal>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-lt/35 bg-emerald-lt/15 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-bright">
            <span className="inline-block h-1.5 w-1.5 animate-[ffPulse_2s_ease-in-out_infinite] rounded-full bg-emerald-lt shadow-[0_0_8px_var(--color-emerald-lt)]" />
            First Group Active
          </span>
        </Reveal>

        {/* Per-character blur-in reveal. "Faith" in ivory, "Flow." in gold. */}
        <h1 className="mb-6 font-display text-[clamp(3.4rem,7vw,5.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-ivory">
          <TextSplit text="Faith" delay={0.2} />
          <span className="text-gold-lt">
            <TextSplit text="Flow." delay={0.45} />
          </span>
        </h1>

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
      </motion.div>

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
