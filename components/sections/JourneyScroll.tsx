'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { OrbLazy } from '../dashboard/OrbLazy';
import type { JourneyStage } from '@/lib/dashboard/journey';

/**
 * The journey, told on the marketing site: the four seasons of the walk
 * (seed -> sprout -> roots -> fruit), the echo of the member dashboard's
 * "grows with you" design.
 *
 * An intro holds the 3D orb, which grows through the seasons as you scroll into
 * the section. Then each season is its own tall, immersive panel, so the four
 * are met one at a time and never skipped past. Not sticky-pinned (this site
 * uses Lenis smooth-scroll, which breaks position: sticky), so it stays robust.
 */

interface Scene {
  stage: JourneyStage;
  num: string;
  eyebrow: string;
  title: string;
  line: string;
  accent: string;
}

const SCENES: Scene[] = [
  {
    stage: 'seed',
    num: '01',
    eyebrow: 'It starts small',
    title: 'A quiet yes.',
    line: 'The Word, and one honest step. No rush, no performance. There is grace for the very first day, and the next one too.',
    accent: '#7e8c84',
  },
  {
    stage: 'sprout',
    num: '02',
    eyebrow: 'Something takes root',
    title: 'You start to grow.',
    line: 'Small rhythms. Prayer that is honest. And showing up, in person, with people who actually know your name.',
    accent: '#52b788',
  },
  {
    stage: 'roots',
    num: '03',
    eyebrow: 'You go deeper',
    title: 'Roots grow down.',
    line: 'Scripture hidden in the heart. Reflection that tells the truth. Friendship that sharpens, the way iron sharpens iron.',
    accent: '#c9a548',
  },
  {
    stage: 'fruit',
    num: '04',
    eyebrow: 'In time, fruit',
    title: 'You bear fruit.',
    line: 'You begin to carry others, the way you were carried. Quietly, faithfully. This is what it was always for.',
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

function SeasonPanel({ scene, index }: { scene: Scene; index: number }) {
  const right = index % 2 === 1;
  return (
    <div
      className={`relative flex min-h-[78vh] items-center ${
        right ? 'md:justify-end' : 'md:justify-start'
      }`}
    >
      {/* Per-season accent glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${scene.accent}22 0%, transparent 70%)`,
          [right ? 'right' : 'left']: '-4rem',
        }}
      />

      {/* Giant ghost number. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 -z-0 hidden -translate-y-1/2 select-none font-display text-[18rem] font-light leading-none md:block ${
          right ? 'left-0' : 'right-0'
        }`}
        style={{ color: `${scene.accent}14` }}
      >
        {scene.num}
      </span>

      <Reveal y={40} className="relative z-10 max-w-lg">
        <div className="border-l-2 pl-8 md:pl-10" style={{ borderColor: scene.accent }}>
          <div className="mb-3 flex items-center gap-3">
            <span
              className="font-display text-xl font-light"
              style={{ color: scene.accent }}
            >
              {scene.num}
            </span>
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: `${scene.accent}66` }} />
            <p
              className="text-[11px] font-medium uppercase tracking-[0.24em]"
              style={{ color: scene.accent }}
            >
              {scene.eyebrow}
            </p>
          </div>
          <h3 className="mb-4 font-display text-4xl font-light leading-tight text-ivory md:text-5xl">
            {scene.title}
          </h3>
          <p className="text-lg leading-relaxed text-silver">{scene.line}</p>
        </div>
      </Reveal>
    </div>
  );
}

export function JourneyScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  // Only mount the WebGL orb on desktop. On phones it is the heaviest thing on
  // the page, so we render a light, GPU-cheap glow instead (no three.js chunk).
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const [stage, setStage] = useState<JourneyStage>('seed');
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const t = v / 0.45; // the orb completes its growth across the intro + first panels
    const next: JourneyStage = t < 0.25 ? 'seed' : t < 0.5 ? 'sprout' : t < 0.75 ? 'roots' : 'fruit';
    setStage((prev) => (prev === next ? prev : next));
  });

  const orbScale = useTransform(scrollYProgress, [0, 0.45], [0.9, 1.1]);
  const activeIndex = SCENES.findIndex((s) => s.stage === stage);

  return (
    <section ref={ref} id="walk" className="relative overflow-hidden py-[110px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(201,165,72,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(27,67,50,0.08) 0%, transparent 55%)',
        }}
      />
      <Container>
        {/* Intro: the orb, growing. */}
        <Reveal className="text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">The walk</p>
          <h2 className="mb-4 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            It <em className="not-italic text-gold-lt">grows</em> with you.
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-silver md:text-lg">
            No one is handed the deep things on day one. The dashboard, like the walk, opens up a
            little more as you go. Take it slowly. There is no race here.
          </p>
        </Reveal>

        <motion.div
          style={{ scale: orbScale }}
          className="relative mx-auto mb-6 h-[clamp(220px,38vw,380px)] w-[clamp(220px,38vw,380px)]"
        >
          {isDesktop ? (
            <OrbLazy className="h-full w-full" areas={ORB_AREAS} vitality={6} stage={stage} />
          ) : (
            <div aria-hidden className="flex h-full w-full items-center justify-center">
              <div
                className="relative h-[72%] w-[72%] rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 50% 38%, rgba(228,201,122,0.30), rgba(201,165,72,0.10) 45%, transparent 70%)',
                  boxShadow: '0 0 60px rgba(201,165,72,0.18)',
                }}
              >
                <div className="absolute inset-0 rounded-full border border-gold/25" />
                <div className="absolute inset-[20%] rounded-full border border-gold/15" />
              </div>
            </div>
          )}
        </motion.div>

        <div className="mb-4 flex items-center justify-center gap-2.5">
          {SCENES.map((s, i) => (
            <span
              key={s.stage}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === activeIndex ? 30 : 8,
                backgroundColor: i <= activeIndex ? s.accent : '#3a423e',
              }}
            />
          ))}
        </div>

        <p className="mb-4 text-center text-[11px] uppercase tracking-[0.28em] text-muted">
          Keep scrolling
        </p>

        {/* The four seasons, each its own immersive panel. */}
        {SCENES.map((scene, i) => (
          <SeasonPanel key={scene.stage} scene={scene} index={i} />
        ))}
      </Container>
    </section>
  );
}
