'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { JourneyStage } from '@/lib/dashboard/journey';

export interface GlobeArea {
  id: string;
  name: string;
  color: string;
  /** Latest score for the area, 0-10. Drives how many of its drops fall. */
  score: number;
}

interface GlobeHeroProps {
  className?: string;
  areas?: GlobeArea[];
  /** The journey stage. Picks which globe the member sees. */
  stage?: JourneyStage;
}

/**
 * The dashboard hero: a small glass globe that grows with the member's walk
 * (seed -> sprout -> roots -> fruit, decided by the existing journey engine,
 * in-person gate included), watered by their progress. Each progress area
 * rains its own drops onto the globe: one drop per score point, white with
 * a noticeable tint of the area's color. The rain is deliberately STATIC —
 * deterministic positions, no per-frame animation — so the metaphor stays
 * calm and the page stays cheap. Replaces the old WebGL PremiumOrb (three +
 * @react-three, ~500KB of client JS) with an image and an SVG overlay.
 */

const STAGE_IMAGE: Record<JourneyStage, string> = {
  seed: '/assets/journey/globe-seed.webp',
  sprout: '/assets/journey/globe-sprout.webp',
  roots: '/assets/journey/globe-roots.webp',
  fruit: '/assets/journey/globe-fruit.webp',
};

const STAGES = Object.keys(STAGE_IMAGE) as JourneyStage[];

/**
 * What the globe visibly holds at each stage, for assistive tech. Describes
 * the visible state without naming the stages, per the journey design rule
 * that the member is never handed a stage label.
 */
const STAGE_VISUAL: Record<JourneyStage, string> = {
  seed: 'holding a single seed in dark soil',
  sprout: 'holding a young sprout reaching up',
  roots: 'holding a sapling with roots glowing deep in the soil',
  fruit: 'holding a small flourishing tree bearing bright fruit',
};

/** How "grown" each stage feels, 0..1. Warms the halo as the walk deepens. */
const STAGE_GROWTH: Record<JourneyStage, number> = {
  seed: 0,
  sprout: 0.34,
  roots: 0.67,
  fruit: 1,
};

/**
 * How much of the frame each stage's globe artwork actually occupies. The
 * seed jar is small on purpose (the globe itself grows through the stages),
 * so the rain field, halo, and sheen all shrink to land on the glass
 * instead of floating in the void around it.
 */
const STAGE_SPAN: Record<JourneyStage, number> = {
  seed: 0.5,
  sprout: 0.95,
  roots: 1,
  fruit: 0.95,
};

/** Deterministic PRNG so every visit shows the same rain for the same data. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Drop {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  color: string;
  areaName: string;
  score: number;
}

/** Globe geometry in the 100x100 viewBox: centered, matching the artwork. */
const CX = 50;
const CY = 51;
const R = 38;

function buildDrops(areas: GlobeArea[], span: number): Drop[] {
  const drops: Drop[] = [];
  for (const area of areas) {
    const count = Math.max(0, Math.min(10, Math.round(area.score)));
    const rand = mulberry32(hashString(area.id));
    for (let i = 0; i < count; i++) {
      // Sample a point inside the globe circle, gently biased upward so the
      // rain reads as landing on the glass, not pooling at the base.
      const theta = rand() * Math.PI * 2;
      const u = rand();
      const r = R * span * Math.sqrt(u) * 0.92;
      const x = CX + Math.sin(theta) * r;
      let y = CY + Math.cos(theta) * r;
      y = CY + (y - CY) * 0.82 - 3;
      drops.push({
        x,
        y,
        scale: 0.75 + rand() * 0.45,
        rotate: (rand() - 0.5) * 18,
        color: area.color,
        areaName: area.name,
        score: count,
      });
    }
  }
  return drops;
}

/** Classic raindrop silhouette, ~2.4 units tall in the 100-unit viewBox. */
const DROP_PATH =
  'M0,-1.35 C0.62,-0.55 1.05,0.05 1.05,0.62 A1.05,1.05 0 1,1 -1.05,0.62 C-1.05,0.05 -0.62,-0.55 0,-1.35';

export function GlobeHero({ className = '', areas = [], stage = 'seed' }: GlobeHeroProps) {
  const reduce = useReducedMotion();
  const growth = STAGE_GROWTH[stage] ?? 0;
  const span = STAGE_SPAN[stage] ?? 1;
  const drops = useMemo(() => buildDrops(areas, span), [areas, span]);
  const haloInset = `${Math.round(50 - 44 * span)}%`;
  const sheenInset = `${Math.round(50 - 40 * span)}%`;

  // Rain only appears with real progress data (the dashboard). On the public
  // journey the globe renders rain-free, so the label stays context-neutral.
  const rainSummary =
    drops.length > 0 ? ` ${drops.length} drops of progress rain on the glass.` : '';

  return (
    <div
      className={`relative ${className}`}
      role="img"
      aria-label={`A small glass globe, ${STAGE_VISUAL[stage] ?? STAGE_VISUAL.seed}, growing as the walk with God deepens.${rainSummary}`}
    >
      {/* Soft gold halo behind the globe — warms as the walk deepens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: haloInset,
          background: `radial-gradient(circle, rgba(201,165,72,${0.1 + growth * 0.16}) 0%, transparent 65%)`,
          filter: 'blur(6px)',
          transition: 'inset 700ms ease',
        }}
      />

      {/* The globe itself, breathing gently. */}
      <motion.div
        className="absolute inset-0"
        animate={reduce ? undefined : { scale: [1, 1.02, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* All four stage images stay mounted, crossfading by opacity. This
            preloads every season (small webps) and means a stage change can
            never blank the globe mid-swap (WebKit clears a reused <img> the
            moment its src changes), so the homepage scrub and any future
            "you came back and it grew" moment fade calmly instead. */}
        {STAGES.map((s) => (
          <div
            key={s}
            aria-hidden={s !== stage || undefined}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: s === stage ? 1 : 0 }}
          >
            <Image
              src={STAGE_IMAGE[s]}
              alt=""
              fill
              sizes="(min-width: 768px) 380px, 280px"
              className="object-contain"
            />
          </div>
        ))}

        {/* A slow, soft sheen that drifts across the glass. Always rendered so
            server and client trees match (branching the element's existence on
            useReducedMotion caused a structural hydration mismatch for
            reduced-motion users); only the animation is gated. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: sheenInset,
            background:
              'linear-gradient(115deg, transparent 42%, rgba(255,245,214,0.10) 50%, transparent 58%)',
            mixBlendMode: 'plus-lighter',
            transition: 'inset 700ms ease',
          }}
          animate={reduce ? undefined : { x: ['-12%', '12%', '-12%'] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* The rain: one drop per score point per area, white with the area's
            color showing through. Static on purpose. */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {drops.map((d, i) => (
            <g
              key={i}
              transform={`translate(${d.x.toFixed(2)} ${d.y.toFixed(2)}) rotate(${d.rotate.toFixed(1)}) scale(${d.scale.toFixed(2)})`}
            >
              <title>{`${d.areaName} · ${d.score}/10`}</title>
              <path d={DROP_PATH} fill="#ffffff" opacity={0.9} />
              <path d={DROP_PATH} fill={d.color} opacity={0.62} transform="scale(0.66)" />
              <circle cx={-0.28} cy={0.32} r={0.2} fill="#ffffff" opacity={0.85} />
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}
