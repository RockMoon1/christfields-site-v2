'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { OrbLazy } from '../dashboard/OrbLazy';
import type { JourneyStage } from '@/lib/dashboard/journey';

/**
 * The journey, told on the marketing site: the four seasons of the walk
 * (seed -> sprout -> roots -> fruit), the echo of the member dashboard's
 * "grows with you" design. The 3D orb sits at the center and GROWS through the
 * seasons as the section scrolls through view, then each season reveals in turn.
 *
 * Deliberately NOT a sticky-pinned section: this site uses Lenis smooth-scroll,
 * which breaks native position: sticky. Normal flow + scroll-linked motion keeps
 * it reliable while still feeling cinematic. Reduced-motion safe via Reveal/orb.
 */

interface Scene {
  stage: JourneyStage;
  eyebrow: string;
  title: string;
  line: string;
  accent: string;
}

const SCENES: Scene[] = [
  {
    stage: 'seed',
    eyebrow: 'It starts small',
    title: 'A quiet yes.',
    line: 'The Word, and one honest step. No rush, no performance. There is grace for the very first day.',
    accent: '#7e8c84',
  },
  {
    stage: 'sprout',
    eyebrow: 'Something takes root',
    title: 'You start to grow.',
    line: 'Small rhythms. Prayer that is honest. And showing up, in person, with people who know your name.',
    accent: '#52b788',
  },
  {
    stage: 'roots',
    eyebrow: 'You go deeper',
    title: 'Roots grow down.',
    line: 'Scripture hidden in the heart. Reflection that tells the truth. Friendship that sharpens, like iron on iron.',
    accent: '#c9a548',
  },
  {
    stage: 'fruit',
    eyebrow: 'In time, fruit',
    title: 'You bear fruit.',
    line: 'You begin to carry others, the way you were carried. This is what it was always for.',
    accent: '#e4c97a',
  },
];

const ORB_AREAS = [
  { id: 'a', name: 'Presence', color: '#c9a548' },
  { id: 'b', name: 'Honesty', color: '#2d6a4f' },
  { id: 'c', name: 'Scripture', color: '#e4c97a' },
  { id: 'd', name: 'Prayer', color: '#5b8db8' },
  { id: 'e', name: 'Sharpening', color: '#c47b3c' },
];

export function JourneyScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const [stage, setStage] = useState<JourneyStage>('seed');
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Map the middle of the section's travel to the four seasons.
    const t = (v - 0.2) / 0.6; // 0..1 across the readable middle
    const next: JourneyStage = t < 0.25 ? 'seed' : t < 0.5 ? 'sprout' : t < 0.75 ? 'roots' : 'fruit';
    setStage((prev) => (prev === next ? prev : next));
  });

  const orbScale = useTransform(scrollYProgress, [0.1, 0.9], [0.92, 1.08]);
  const activeIndex = SCENES.findIndex((s) => s.stage === stage);

  return (
    <section ref={ref} className="relative overflow-hidden py-[120px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(201,165,72,0.07) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(27,67,50,0.10) 0%, transparent 60%)',
        }}
      />
      <Container>
        <Reveal className="text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">The walk</p>
          <h2 className="mb-4 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            It <em className="not-italic text-gold-lt">grows</em> with you.
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-silver md:text-lg">
            No one is handed the deep things on day one. The dashboard, like the walk, opens up a
            little more as you go.
          </p>
        </Reveal>

        {/* The orb, growing through the seasons as you scroll. */}
        <motion.div
          style={{ scale: orbScale }}
          className="relative mx-auto mb-4 h-[clamp(220px,38vw,380px)] w-[clamp(220px,38vw,380px)]"
        >
          <OrbLazy className="h-full w-full" areas={ORB_AREAS} vitality={6} stage={stage} />
        </motion.div>

        {/* Season indicator. */}
        <div className="mb-16 flex items-center justify-center gap-2.5">
          {SCENES.map((s, i) => (
            <span
              key={s.stage}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === activeIndex ? 28 : 8,
                backgroundColor: i <= activeIndex ? s.accent : '#3a423e',
              }}
            />
          ))}
        </div>

        {/* The four seasons, revealed as a staircase. */}
        <div className="mx-auto max-w-3xl">
          {SCENES.map((scene, i) => (
            <Reveal key={scene.stage} delay={0.04} y={32}>
              <div
                className={`relative border-l-2 pb-12 pl-8 last:pb-0 md:pl-10 ${
                  i <= activeIndex ? '' : 'opacity-60'
                }`}
                style={{ borderColor: i <= activeIndex ? scene.accent : '#26302b' }}
              >
                <span
                  aria-hidden
                  className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-black-2"
                  style={{ backgroundColor: scene.accent, boxShadow: `0 0 12px ${scene.accent}88` }}
                />
                <p
                  className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em]"
                  style={{ color: scene.accent }}
                >
                  {scene.eyebrow}
                </p>
                <h3 className="mb-3 font-display text-3xl font-light leading-tight text-ivory md:text-4xl">
                  {scene.title}
                </h3>
                <p className="max-w-md text-base leading-relaxed text-silver">{scene.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
