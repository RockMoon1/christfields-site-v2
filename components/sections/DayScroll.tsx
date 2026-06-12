'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { Container } from '../Container';
import { SectionHeader } from '../SectionHeader';

/**
 * "A day, walked with him." A scrollytelling timeline: the central line fills
 * with gold as you scroll, and each moment of an ordinary day reveals in turn.
 *
 * The line, the dots, and the glyph all derive from one scrollYProgress, so
 * the moment the gold fill reaches a dot, the dot blooms with a halo in
 * response — ignition, not decoration. A small sun rides the tip of the line
 * and gives way to a moon past midday, a quiet time-of-day metaphor. Beats
 * enter with small alternating x offsets so the column does not arrive as six
 * identical fades. Deliberately unpinned: this one paces real information,
 * and reading speed should stay in the reader's hands.
 */

interface Beat {
  time: string;
  title: string;
  line: string;
  accent: string;
}

const BEATS: Beat[] = [
  {
    time: 'Morning',
    title: 'Open the Word first.',
    line: 'Before the noise, a few verses and a slow breath. Let the day start with him, not with the feed.',
    accent: '#e4c97a',
  },
  {
    time: 'Midmorning',
    title: 'Hand off the worry.',
    line: 'One honest prayer about the thing you are carrying. You were never meant to hold it alone.',
    accent: '#5b8db8',
  },
  {
    time: 'Midday',
    title: 'Come and rest.',
    line: 'When it gets heavy, stop. Sabbath is not one day a year. Rest is a Person, and you can come to him right now.',
    accent: '#a64453',
  },
  {
    time: 'Afternoon',
    title: 'Sharpen someone.',
    line: 'One message. One word of encouragement. Iron does not sharpen itself.',
    accent: '#c47b3c',
  },
  {
    time: 'Evening',
    title: 'Name the good.',
    line: 'Three things you are thankful for. Gratitude has a way of re-reading the whole day.',
    accent: '#52b788',
  },
  {
    time: 'Night',
    title: 'Look back with him.',
    line: 'A gentle examen. Where was the light, where was it hard, and what do you carry into tomorrow.',
    accent: '#7e6ba8',
  },
];

interface BeatItemProps {
  beat: Beat;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduce: boolean;
}

/**
 * One moment of the day. Its dot derives its lit state from the same scroll
 * progress that fills the line: as the gold fill passes the dot's position,
 * the dot scales up and a halo blooms then settles — all motion values, no
 * per-frame state. Under reduced motion the dot is simply lit.
 */
function BeatItem({ beat, index, total, progress, reduce }: BeatItemProps) {
  const t = index / total;
  const lit = useTransform(progress, [t - 0.02, t + 0.04], [0, 1]);
  const dotOpacity = useTransform(lit, [0, 1], [0.3, 1]);
  const dotScale = useTransform(lit, [0, 1], [0.7, 1]);
  const haloOpacity = useTransform(progress, [t - 0.02, t + 0.04, t + 0.14], [0, 0.95, 0.55]);
  const haloScale = useTransform(progress, [t - 0.02, t + 0.04, t + 0.14], [0.3, 1.45, 1]);
  const fromLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: fromLeft ? -22 : 22 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative pb-14 pl-10 last:pb-0 md:pl-14"
    >
      <span aria-hidden className="absolute -left-[5px] top-1.5 h-2.5 w-2.5">
        {/* Halo: blooms past full as the fill arrives, then settles. */}
        <motion.span
          className="absolute -inset-2.5 rounded-full"
          style={{
            background: `radial-gradient(circle, ${beat.accent}59 0%, transparent 70%)`,
            boxShadow: `0 0 14px ${beat.accent}66`,
            opacity: reduce ? 0.5 : haloOpacity,
            scale: reduce ? 1 : haloScale,
          }}
        />
        {/* The dot itself: dim until the gold fill reaches it. */}
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: beat.accent,
            opacity: reduce ? 1 : dotOpacity,
            scale: reduce ? 1 : dotScale,
          }}
        />
      </span>
      <p
        className="mb-1 text-[11px] font-medium uppercase tracking-[0.24em]"
        style={{ color: beat.accent }}
      >
        {beat.time}
      </p>
      <h3 className="mb-2 font-display text-2xl font-light leading-tight text-ivory md:text-3xl">
        {beat.title}
      </h3>
      <p className="max-w-md text-base leading-relaxed text-silver">{beat.line}</p>
    </motion.div>
  );
}

/**
 * The small ornament riding the tip of the gold fill: a sun through the
 * first half of the day, crossfading to a moon past midday. Travels on a
 * composited transform (y in pixels from the measured line height), never
 * by animating `top`. Decorative only, hidden from assistive tech, and not
 * rendered at all under reduced motion.
 */
function DayGlyph({ progress, lineH }: { progress: MotionValue<number>; lineH: number }) {
  const y = useTransform(progress, (v) => v * lineH);
  const opacity = useTransform(progress, [0.005, 0.05], [0, 1]);
  const sunOpacity = useTransform(progress, [0.42, 0.58], [1, 0]);
  const moonOpacity = useTransform(progress, [0.42, 0.58], [0, 1]);

  return (
    <motion.span
      aria-hidden
      style={{ y, opacity }}
      className="absolute -left-[7px] -top-[7px] block h-3.5 w-3.5 text-gold-lt"
    >
      {/* Plate so the line does not run through the glyph, plus the tip glow. */}
      <span className="absolute -inset-1 rounded-full bg-black shadow-[0_0_14px_rgba(228,201,122,0.45)]" />
      <motion.svg
        style={{ opacity: sunOpacity }}
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.5v2.5" />
          <path d="M12 19v2.5" />
          <path d="M2.5 12H5" />
          <path d="M19 12h2.5" />
          <path d="M5.3 5.3l1.8 1.8" />
          <path d="M16.9 16.9l1.8 1.8" />
          <path d="M18.7 5.3l-1.8 1.8" />
          <path d="M7.1 16.9l-1.8 1.8" />
        </g>
      </motion.svg>
      <motion.svg
        style={{ opacity: moonOpacity }}
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </motion.svg>
    </motion.span>
  );
}

export function DayScroll() {
  const ref = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Measure the line once (and on resize) so the glyph can ride its tip with
  // a transform instead of animating `top`, which would relayout per frame.
  const [lineH, setLineH] = useState(0);
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const measure = () => setLineH(el.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section ref={ref} id="day" className="relative overflow-hidden py-[110px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(201,165,72,0.05) 0%, transparent 55%)',
        }}
      />
      <Container>
        <SectionHeader
          eyebrow="What it looks like"
          title={
            <>
              A day, <em className="not-italic text-gold-lt">walked with him.</em>
            </>
          }
          lede="Not a heavier to-do list. A few small turns toward God, woven through an ordinary day."
          ledeClassName="max-w-xl"
          className="mb-16"
        />

        <div className="relative mx-auto max-w-2xl">
          {/* The day line, filling with gold as you scroll. */}
          <div aria-hidden ref={lineRef} className="absolute bottom-3 left-0 top-2 w-px bg-border-sub">
            <motion.div
              style={{ scaleY: reduce ? 1 : lineScale }}
              className="h-full w-full origin-top bg-gradient-to-b from-gold via-gold to-gold/30"
            />
            {!reduce && lineH > 0 && (
              <DayGlyph key={lineH} progress={scrollYProgress} lineH={lineH} />
            )}
          </div>

          {BEATS.map((b, i) => (
            <BeatItem
              key={b.title}
              beat={b}
              index={i}
              total={BEATS.length}
              progress={scrollYProgress}
              reduce={reduce}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
