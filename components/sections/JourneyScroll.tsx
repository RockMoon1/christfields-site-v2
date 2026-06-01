'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { OrbLazy } from '../dashboard/OrbLazy';
import type { JourneyStage } from '@/lib/dashboard/journey';

/**
 * Pinned scroll storytelling. The section is tall; an inner panel sticks to the
 * viewport while you scroll through it. The 3D orb sits at the center and GROWS
 * through the four seasons of the walk (seed -> sprout -> roots -> fruit), its
 * stage driven by scroll progress, while the words for each season crossfade.
 *
 * This is the marketing-site echo of the member dashboard's "grows with you"
 * journey. Scroll-driven (not autoplay), so it respects the reader's pace.
 */

interface Scene {
  stage: JourneyStage;
  eyebrow: string;
  title: string;
  line: string;
}

const SCENES: Scene[] = [
  {
    stage: 'seed',
    eyebrow: 'It starts small',
    title: 'A quiet yes.',
    line: 'The Word, and one honest step. No rush, no performance. Grace for the very first day.',
  },
  {
    stage: 'sprout',
    eyebrow: 'Something takes root',
    title: 'You start to grow.',
    line: 'Small rhythms. Prayer that is honest. And showing up, in person, with people who know your name.',
  },
  {
    stage: 'roots',
    eyebrow: 'You go deeper',
    title: 'Roots grow down.',
    line: 'Scripture hidden in the heart. Reflection that tells the truth. Friendship that sharpens, like iron on iron.',
  },
  {
    stage: 'fruit',
    eyebrow: 'In time, fruit',
    title: 'You bear fruit.',
    line: 'You begin to carry others, the way you were carried. This is what it was always for.',
  },
];

const ORB_AREAS = [
  { id: 'a', name: 'Presence', color: '#c9a548' },
  { id: 'b', name: 'Honesty', color: '#2d6a4f' },
  { id: 'c', name: 'Scripture', color: '#e4c97a' },
  { id: 'd', name: 'Prayer', color: '#5b8db8' },
  { id: 'e', name: 'Sharpening', color: '#c47b3c' },
];

function Scene({
  scene,
  index,
  count,
  progress,
}: {
  scene: Scene;
  index: number;
  count: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  // Each scene owns a slice of the scroll. It fades and rises in, holds, then
  // fades and rises out as the next takes over.
  const slice = 1 / count;
  const start = index * slice;
  const inAt = start + slice * 0.12;
  const holdEnd = start + slice * 0.78;
  const end = start + slice;

  const opacity = useTransform(
    progress,
    [start, inAt, holdEnd, end],
    index === count - 1 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  const y = useTransform(progress, [start, inAt, holdEnd, end], [28, 0, 0, -28]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 mx-auto max-w-xl px-7 text-center">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
        {scene.eyebrow}
      </p>
      <h3 className="mb-4 font-display text-4xl font-light leading-tight text-ivory md:text-5xl">
        {scene.title}
      </h3>
      <p className="mx-auto max-w-md text-base leading-relaxed text-silver md:text-lg">{scene.line}</p>
    </motion.div>
  );
}

export function JourneyScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const [stage, setStage] = useState<JourneyStage>('seed');
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next: JourneyStage = v < 0.25 ? 'seed' : v < 0.5 ? 'sprout' : v < 0.75 ? 'roots' : 'fruit';
    setStage((prev) => (prev === next ? prev : next));
  });

  // The orb scales up a touch as the journey deepens.
  const orbScale = useTransform(scrollYProgress, [0, 1], [0.92, 1.08]);
  const activeIndex = SCENES.findIndex((s) => s.stage === stage);

  return (
    <section ref={ref} className="relative h-[320vh]">
      {/* Sticky stage that holds while you scroll through the section. */}
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* Ambient depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(201,165,72,0.08) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(27,67,50,0.12) 0%, transparent 60%)',
          }}
        />

        <p className="absolute top-[12vh] text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
          The walk
        </p>

        {/* The orb, growing through the seasons. */}
        <motion.div
          style={{ scale: orbScale }}
          className="relative h-[clamp(220px,42vh,420px)] w-[clamp(220px,42vh,420px)]"
        >
          <OrbLazy className="h-full w-full" areas={ORB_AREAS} vitality={6} stage={stage} />
        </motion.div>

        {/* The words for each season, crossfading. Sits below the orb. */}
        <div className="relative mt-[5vh] h-48 w-full">
          {SCENES.map((scene, i) => (
            <Scene key={scene.stage} scene={scene} index={i} count={SCENES.length} progress={scrollYProgress} />
          ))}
        </div>

        {/* Progress dots for the four seasons. */}
        <div className="absolute bottom-[10vh] flex items-center gap-2.5">
          {SCENES.map((s, i) => (
            <span
              key={s.stage}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === activeIndex ? 28 : 8,
                backgroundColor: i <= activeIndex ? '#c9a548' : '#3a423e',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
