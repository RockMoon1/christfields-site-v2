'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { Container } from '../Container';
import { SectionHeader } from '../SectionHeader';
import { PinnedScrub } from '../motion/PinnedScrub';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface Scene {
  stage: 'seed' | 'sprout' | 'roots' | 'fruit';
  num: string;
  eyebrow: string;
  title: string;
  line: string;
  accent: string;
  imageDescription: string;
}

// Existing public copy and artwork, independent of member progress or scores.
const SCENES: Scene[] = [
  {
    stage: 'seed', num: '01', eyebrow: 'It starts small', title: 'A quiet yes.',
    line: 'The Word, and one honest step. No rush, no performance. There is grace for the very first day, and the next one too.',
    accent: '#7e8c84', imageDescription: 'A glass globe holding a single seed in dark soil.',
  },
  {
    stage: 'sprout', num: '02', eyebrow: 'Something takes root', title: 'You start to grow.',
    line: 'Small rhythms. Prayer that is honest. And showing up, in person, with people who actually know your name.',
    accent: '#52b788', imageDescription: 'A glass globe holding a young sprout reaching up.',
  },
  {
    stage: 'roots', num: '03', eyebrow: 'You go deeper', title: 'Roots grow down.',
    line: 'Scripture hidden in the heart. Reflection that tells the truth. Friendship that sharpens, the way iron sharpens iron.',
    accent: '#c9a548', imageDescription: 'A glass globe holding a sapling with roots glowing deep in the soil.',
  },
  {
    stage: 'fruit', num: '04', eyebrow: 'In time, fruit', title: 'You bear fruit.',
    line: 'You begin to carry others, the way you were carried. Quietly, faithfully. This is what it was always for.',
    accent: '#e4c97a', imageDescription: 'A glass globe holding a flourishing tree bearing bright fruit.',
  },
];

function JourneyHeader() {
  return (
    <SectionHeader
      align="left"
      eyebrow="The walk"
      title={<>It <em className="not-italic text-gold-lt">grows</em> with you.</>}
      lede="No one is handed the deep things on day one. The walk opens up a little more as you go. Take it slowly. There is no race here."
      ledeClassName="max-w-[56ch]"
    />
  );
}

function SceneCopy({ scene }: { scene: Scene }) {
  return (
    <div className="border-l-2 pl-5 sm:pl-8" style={{ borderColor: scene.accent }}>
      <div className="mb-4 flex items-center gap-3" style={{ color: scene.accent }}>
        <span className="font-display text-xl">{scene.num}</span>
        <span aria-hidden className="h-px w-6 bg-current opacity-40" />
        <p className="font-body text-meta font-medium uppercase tracking-[0.2em]">{scene.eyebrow}</p>
      </div>
      <h3 className="mb-4 font-display text-4xl font-light leading-tight text-ivory lg:text-5xl">
        {scene.title}
      </h3>
      <p className="max-w-[42ch] text-base leading-relaxed text-silver sm:text-lg">{scene.line}</p>
    </div>
  );
}

function GlobeImage({ scene, pinned = false }: { scene: Scene; pinned?: boolean }) {
  return (
    <Image
      src={`/assets/journey/globe-${scene.stage}.webp`}
      alt={scene.imageDescription}
      width={1024}
      height={1024}
      // Load all pinned layers together: scrolling must not reveal an empty
      // frame. Linear images use native lazy loading in their normal rows.
      loading={pinned ? 'eager' : 'lazy'}
      sizes="(min-width: 1024px) 460px, (min-width: 640px) 320px, 85vw"
      className="h-full w-full object-contain mix-blend-lighten"
      // Feather only the artwork's empty outer frame; text never enters a mask.
      style={{ maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 72%)' }}
    />
  );
}

function PinnedScene({ scene, index, active, progress }: {
  scene: Scene; index: number; active: number; progress: MotionValue<number>;
}) {
  const start = index / 4;
  const end = (index + 1) / 4;
  const range = index === 0 ? [end - 0.025, end + 0.025]
    : index === 3 ? [start - 0.025, start + 0.025]
      : [start - 0.025, start + 0.025, end - 0.025, end + 0.025];
  const opacity = useTransform(progress, range, index === 0 ? [1, 0]
    : index === 3 ? [0, 1] : [0, 1, 1, 0]);
  const scale = useTransform(progress, [start, end], [0.97, 1.015]);
  const y = useTransform(progress, [start, end], [6, -6]);

  return (
    <motion.li
      data-journey-scene={scene.stage}
      style={{ opacity, pointerEvents: index === active ? 'auto' : 'none' }}
      className="absolute inset-0 grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-12"
    >
      <motion.div style={{ scale, y }} className="relative mx-auto aspect-square w-full max-w-[min(48vh,460px)]">
        <div aria-hidden className="absolute inset-[14%] rounded-full"
          style={{ background: `radial-gradient(circle, ${scene.accent}12, transparent 70%)` }} />
        <GlobeImage scene={scene} pinned />
      </motion.div>
      {/* All four passages remain in document reading order. No hidden links
          or controls enter the tab order inside a crossfading layer. */}
      <SceneCopy scene={scene} />
    </motion.li>
  );
}

function PinnedStage({ progress }: { progress: MotionValue<number> }) {
  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, 'change', value => {
    setActive(Math.min(3, Math.max(0, Math.floor(value * 4))));
  });
  return (
    <Container className="flex h-full flex-col pb-9 pt-24">
      <JourneyHeader />
      <ol aria-label="Four seasons of the walk" className="relative min-h-0 flex-1">
        {SCENES.map((scene, index) => <PinnedScene key={scene.stage} scene={scene} index={index} active={active} progress={progress} />)}
      </ol>
      <div aria-hidden className="flex items-center gap-5 border-t border-border-sub pt-5 text-sm text-silver">
        <span className="tabular-nums text-ivory">{SCENES[active].num} / 04</span>
        <div className="flex gap-2">
          {SCENES.map((scene, index) => <span key={scene.stage} className="h-px w-8"
            style={{ backgroundColor: index <= active ? scene.accent : '#3a423e' }} />)}
        </div>
        <span className="ml-auto">Keep scrolling</span>
      </div>
    </Container>
  );
}

function LinearJourney() {
  return (
    <Container className="py-section">
      <JourneyHeader />
      <ol aria-label="Four seasons of the walk" className="mt-8 divide-y divide-border-sub">
        {SCENES.map(scene => (
          <li key={scene.stage} data-journey-scene={scene.stage}
            className="grid items-center gap-6 py-10 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-10 sm:py-12">
            <div className="mx-auto aspect-square w-full max-w-[21rem]">
              <GlobeImage scene={scene} />
            </div>
            <SceneCopy scene={scene} />
          </li>
        ))}
      </ol>
    </Container>
  );
}

export function JourneyScroll() {
  const reduce = useReducedMotion();
  const [capable, setCapable] = useState(false);
  useEffect(() => {
    // Short screens, touch, zoomed layouts and phones get ordinary reading
    // flow, with every image beside its own text. Preference changes are live.
    const query = window.matchMedia('(min-width: 1024px) and (min-height: 760px) and (pointer: fine)');
    const update = () => setCapable(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const pinned = capable && !reduce;
  return (
    <section id="walk" data-journey-layout={pinned ? 'pinned' : 'linear'} className="relative isolate">
      {pinned
        ? <PinnedScrub lengthVh={4}>{progress => <PinnedStage progress={progress} />}</PinnedScrub>
        : <LinearJourney />}
    </section>
  );
}
