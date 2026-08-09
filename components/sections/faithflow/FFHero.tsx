'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { Button } from '../../Button';
import { Reveal } from '../../Reveal';
import { HeroSpotlight } from '../../motion/HeroSpotlight';
import { TextSplit } from '../../motion/TextSplit';

/**
 * FaithFlow hero. Display type is scaled to match the home hero's presence,
 * and the headline rises out of a per-character mask (letterpress wipe)
 * instead of blur-fading, so the page opens with the family's editorial
 * entrance grammar. The tagline and the Proverbs 27:17 line arrive word by
 * word at reading pace — the verse string itself is untouched.
 */
export function FFHero() {
  const { scrollY } = useScroll();
  // Parallax tuned so the background visibly drifts as you scroll past
  // the hero. Combined with the content fade, this creates real depth.
  const bgY = useTransform(scrollY, [0, 800], [0, -260]);
  const contentOpacity = useTransform(scrollY, [0, 600], [1, 0.3]);
  // The content recedes slightly on exit, mirroring the home hero's
  // cinematic dissolve (transform/opacity only — no scroll-driven blur).
  const contentScale = useTransform(scrollY, [0, 600], [1, 0.95]);

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

      <motion.div
        style={{ opacity: contentOpacity, scale: contentScale }}
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <Reveal>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-lt/35 bg-emerald-lt/15 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-bright">
            <span className="inline-block h-1.5 w-1.5 animate-[ffPulse_2s_ease-in-out_infinite] rounded-full bg-emerald-lt shadow-[0_0_8px_var(--color-emerald-lt)]" />
            Iron and Ember · Active
          </span>
        </Reveal>

        {/* Per-character masked wipe. "Faith" in ivory, "Flow." in gold. */}
        <h1 className="mb-6 font-display text-[clamp(3.6rem,8vw,6.5rem)] font-light leading-[1.04] tracking-[-0.01em] text-ivory">
          <TextSplit text="Faith" mask delay={0.2} />
          <span className="text-gold-lt">
            <TextSplit text="Flow." mask delay={0.42} />
          </span>
        </h1>

        <p className="mx-auto mb-6 max-w-xl text-lg leading-relaxed text-ivory-dim md:text-xl">
          <TextSplit
            text="Real community. Scripture-rooted accountability. Faith lived together."
            by="word"
            mask
            delay={0.75}
          />
        </p>

        <p className="mb-10 font-display text-base italic text-silver md:text-lg">
          <TextSplit
            text={'“As iron sharpens iron, so one person sharpens another.”'}
            by="word"
            mask
            delay={1.0}
          />
        </p>

        <Reveal delay={1.2}>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="#get-involved">Join or Learn More &rarr;</Button>
            <Button href="#groups" variant="ghost">
              Meet the Community
            </Button>
          </div>
        </Reveal>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.3em] text-muted"
      >
        <p className="mb-2">Scroll</p>
        <div className="scroll-line mx-auto h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </motion.div>
    </section>
  );
}
