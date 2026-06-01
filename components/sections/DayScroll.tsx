'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';

/**
 * "A day, walked with him." A scrollytelling timeline: the central line fills
 * with gold as you scroll, and each moment of an ordinary day reveals in turn.
 *
 * This is the engagement-positive kind of interactivity the research points to:
 * it paces real, concrete information (what the daily walk actually looks like)
 * rather than just adding movement. Non-sticky, so it stays reliable.
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

export function DayScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

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
        <Reveal className="text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            What it looks like
          </p>
          <h2 className="mb-4 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            A day, <em className="not-italic text-gold-lt">walked with him.</em>
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-base leading-relaxed text-silver md:text-lg">
            Not a heavier to-do list. A few small turns toward God, woven through an ordinary day.
          </p>
        </Reveal>

        <div className="relative mx-auto max-w-2xl">
          {/* The day line, filling with gold as you scroll. */}
          <div aria-hidden className="absolute bottom-3 left-0 top-2 w-px bg-border-sub">
            <motion.div
              style={{ scaleY: lineScale }}
              className="h-full w-full origin-top bg-gradient-to-b from-gold via-gold to-gold/30"
            />
          </div>

          {BEATS.map((b) => (
            <Reveal key={b.title} y={28} className="relative pb-14 pl-10 last:pb-0 md:pl-14">
              <span
                aria-hidden
                className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: b.accent, boxShadow: `0 0 12px ${b.accent}` }}
              />
              <p
                className="mb-1 text-[11px] font-medium uppercase tracking-[0.24em]"
                style={{ color: b.accent }}
              >
                {b.time}
              </p>
              <h3 className="mb-2 font-display text-2xl font-light leading-tight text-ivory md:text-3xl">
                {b.title}
              </h3>
              <p className="max-w-md text-base leading-relaxed text-silver">{b.line}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
