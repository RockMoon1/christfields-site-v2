'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { PinnedScrub } from '../motion/PinnedScrub';
import { GlobeHero } from '../dashboard/GlobeHero';
import { cn } from '@/lib/utils';
import type { JourneyStage } from '@/lib/dashboard/journey';

/**
 * The journey, told on the marketing site: the four seasons of the walk
 * (seed -> sprout -> roots -> fruit), the echo of the member dashboard's
 * "grows with you" design.
 *
 * On desktop this is a true pinned chapter (PinnedScrub — Lenis runs in
 * window mode, so position:sticky works): the globe holds the viewport and
 * visibly grows through the seasons (the same GlobeHero members meet on
 * the dashboard, rain-free here — raindrops belong to a member's real
 * progress) while the four scene panels pass under the reader's control.
 * Scene crossfades, the ghost season numbers, the accent color wash, and
 * the progress pills all scrub from the same progress value, so the
 * section transforms instead of scrolling past.
 *
 * Touch devices and reduced-motion readers get the linear stacked flow,
 * so every scene is met at reading pace with no pinning.
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

// No rain on the public journey: raindrops are a member's real progress,
// rendered in code on the dashboard. Here the globe simply grows.

/** Each scene's accent, pre-mixed to a soft rgba for the pinned stage wash. */
const SCENE_WASHES = [
  'rgba(126, 140, 132, 0.10)',
  'rgba(82, 183, 136, 0.10)',
  'rgba(201, 165, 72, 0.10)',
  'rgba(228, 201, 122, 0.10)',
];

const SECTION_GLOW =
  'radial-gradient(ellipse at 50% 0%, rgba(201,165,72,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(27,67,50,0.08) 0%, transparent 55%)';

/** The section's header — shared by both the pinned and linear modes. */
function JourneyHeader({ className }: { className?: string }) {
  return (
    <SectionHeader
      eyebrow="The walk"
      title={
        <>
          It <em className="not-italic text-gold-lt">grows</em> with you.
        </>
      }
      lede="No one is handed the deep things on day one. The walk opens up a little more as you go. Take it slowly. There is no race here."
      ledeClassName="max-w-xl"
      className={className}
    />
  );
}

/** The four progress pills; the active one widens and takes its season's accent. */
function SeasonPills({ activeIndex, className }: { activeIndex: number; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2.5', className)}>
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
  );
}

/** One season's copy block — identical markup in both modes, copy verbatim. */
function SceneCopy({ scene }: { scene: Scene }) {
  return (
    <div className="border-l-2 pl-8 md:pl-10" style={{ borderColor: scene.accent }}>
      <div className="mb-3 flex items-center gap-3">
        <span className="font-display text-xl font-light" style={{ color: scene.accent }}>
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
  );
}

interface PinnedSceneProps {
  scene: Scene;
  index: number;
  active: number;
  progress: MotionValue<number>;
}

/**
 * The four scenes play out across this fraction of the scrub; the remainder
 * is a quiet hold where the final scene stays settled before the stage
 * releases, so the reader gets a beat to absorb it instead of being
 * scrolled straight past.
 */
const SCENE_SPAN = 0.85;

/**
 * One season panel inside the pinned stage. Crossfades and slides through
 * its share of the scrub; the ghost number drifts on a longer travel so
 * the panel reads as passing rather than swapping.
 */
function PinnedScene({ scene, index, active, progress }: PinnedSceneProps) {
  const count = SCENES.length;
  const start = (index * SCENE_SPAN) / count;
  const end = ((index + 1) * SCENE_SPAN) / count;
  const f = 0.04;
  const first = index === 0;
  const last = index === count - 1;

  const range = first
    ? [end - f, end]
    : last
      ? [start, start + f]
      : [start, start + f, end - f, end];
  const opacity = useTransform(progress, range, first ? [1, 0] : last ? [0, 1] : [0, 1, 1, 0]);
  const y = useTransform(progress, range, first ? [0, -32] : last ? [32, 0] : [32, 0, 0, -32]);
  const ghostY = useTransform(progress, [start, end], [70, -70]);

  return (
    <motion.div
      style={{ opacity, y }}
      className={cn(
        'absolute inset-0 flex items-center',
        index !== active && 'pointer-events-none select-none',
      )}
    >
      {/* Giant ghost number, scrub-translating through the panel's window. */}
      <motion.span
        aria-hidden
        style={{ y: ghostY, color: `${scene.accent}14` }}
        className="pointer-events-none absolute right-0 top-1/2 -mt-[7.5rem] select-none font-display text-[15rem] font-light leading-none"
      >
        {scene.num}
      </motion.span>
      <div className="relative z-10 max-w-lg">
        <SceneCopy scene={scene} />
      </div>
    </motion.div>
  );
}

/**
 * The pinned stage itself: orb left (growing seed -> fruit as the scrub
 * crosses each quarter), scenes right, season accent washing the backdrop.
 * The only React state is the active quarter index, which changes four
 * times per pass — everything continuous is a motion value.
 */
function PinnedStage({ progress }: { progress: MotionValue<number> }) {
  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, 'change', (v) => {
    const next = Math.min(
      SCENES.length - 1,
      Math.max(0, Math.floor((v / SCENE_SPAN) * SCENES.length)),
    );
    setActive((prev) => (prev === next ? prev : next));
  });

  const orbScale = useTransform(progress, [0, SCENE_SPAN], [0.9, 1.12]);
  // Stops sit at the midpoint of each scene's window, so the wash matches
  // what is on screen.
  const washColor = useTransform(progress, [0.106, 0.319, 0.531, 0.744], SCENE_WASHES);
  const wash = useMotionTemplate`radial-gradient(ellipse at 35% 50%, ${washColor} 0%, transparent 70%)`;
  const hintOpacity = useTransform(progress, [0.02, 0.12], [1, 0]);

  return (
    <div className="relative flex h-full w-full items-center">
      {/* Season accent wash, crossfading with scrub progress. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: wash }}
      />
      <Container className="grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-12">
        <div className="flex flex-col items-center gap-7">
          <motion.div
            style={{ scale: orbScale }}
            className="relative h-[clamp(240px,30vw,380px)] w-[clamp(240px,30vw,380px)]"
          >
            <GlobeHero className="h-full w-full" stage={SCENES[active].stage} />
          </motion.div>
          <SeasonPills activeIndex={active} />
          <motion.p
            style={{ opacity: hintOpacity }}
            className="text-[11px] uppercase tracking-[0.28em] text-muted"
          >
            Keep scrolling
          </motion.p>
        </div>
        <div className="relative h-[26rem]">
          {SCENES.map((scene, i) => (
            <PinnedScene
              key={scene.stage}
              scene={scene}
              index={i}
              active={active}
              progress={progress}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}

/**
 * Desktop mode: header enters normally, then the stage pins for four
 * viewport-heights of scroll. No overflow-hidden or transforms on any
 * ancestor of the sticky stage (either would break the pin for real).
 */
function PinnedJourney() {
  return (
    <section id="walk" className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: SECTION_GLOW }}
      />
      <Container className="pb-4 pt-[110px]">
        <JourneyHeader />
      </Container>
      {/* Five viewport-heights: ~100vh per season plus an end hold, so the
          last scenes are met at reading pace instead of flying past. */}
      <PinnedScrub lengthVh={5}>{(progress) => <PinnedStage progress={progress} />}</PinnedScrub>
    </section>
  );
}

/** One season panel in the linear fallback flow. */
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
        <SceneCopy scene={scene} />
      </Reveal>
    </div>
  );
}

/**
 * Linear fallback for touch devices and reduced motion: the globe grows as
 * the section scrolls past, then each season is its own tall panel, met one
 * at a time. GlobeHero is an image + static SVG, cheap enough for phones,
 * so the old CSS glow stand-in is gone.
 */
function LinearJourney({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

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
        style={{ background: SECTION_GLOW }}
      />
      <Container>
        <JourneyHeader className="mb-10" />

        <motion.div
          style={reduce ? undefined : { scale: orbScale }}
          className="relative mx-auto mb-6 h-[clamp(220px,38vw,380px)] w-[clamp(220px,38vw,380px)]"
        >
          <GlobeHero className="h-full w-full" stage={stage} />
        </motion.div>

        <SeasonPills activeIndex={activeIndex} className="mb-4" />

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

export function JourneyScroll() {
  // Both default false so first paint is always the linear flow; a capable
  // desktop flips to the pinned chapter right after hydration.
  const [isDesktop, setIsDesktop] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mqDesktop = window.matchMedia('(min-width: 768px)');
    const mqFine = window.matchMedia('(pointer: fine)');
    const update = () => {
      setIsDesktop(mqDesktop.matches);
      setFinePointer(mqFine.matches);
    };
    update();
    mqDesktop.addEventListener('change', update);
    mqFine.addEventListener('change', update);
    return () => {
      mqDesktop.removeEventListener('change', update);
      mqFine.removeEventListener('change', update);
    };
  }, []);
  const reduce = useReducedMotion() ?? false;

  if (isDesktop && finePointer && !reduce) return <PinnedJourney />;
  return <LinearJourney reduce={reduce} />;
}
