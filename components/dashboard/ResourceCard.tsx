'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useState, type MouseEvent } from 'react';
import {
  getResourcesForArea,
  nextTierTeaser,
  tierLabel,
  tierSubtitle,
  type Resource,
  type Tier,
} from '@/lib/resources';
import type { AreaWithEntries } from '@/app/dashboard/(app)/progress/actions';
import type { JournalEntry } from '@/app/dashboard/(app)/resources/actions';
import { JournalSection } from './JournalSection';

interface ResourceCardProps {
  area: AreaWithEntries;
  journalEntries: JournalEntry[];
}

/**
 * A single area's resource card on /dashboard/resources. Pulls the right
 * tier of content based on the user's most recent score and renders it.
 * Color stripe and dot match the orb dot for that area.
 */
export function ResourceCard({ area, journalEntries }: ResourceCardProps) {
  const latest = area.entries[area.entries.length - 1];
  const latestScore = latest?.score ?? null;
  const content = getResourcesForArea({
    presetKey: area.presetKey,
    areaName: area.name,
    latestScore,
  });
  const teaser = nextTierTeaser(content.tier);
  const isPreset = !!area.presetKey;

  // Cursor-following glow inside the card.
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const springX = useSpring(mouseX, { stiffness: 220, damping: 26 });
  const springY = useSpring(mouseY, { stiffness: 220, damping: 26 });
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.article
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className="group relative overflow-hidden rounded-sm border border-border-sub bg-black-3 transition-colors hover:border-border-gold"
    >
      {/* Cursor-following accent glow. Lives behind the content; the children
          render z-1 via header/section/footer which sit above .pointer-events-none. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          left: springX,
          top: springY,
          background: `radial-gradient(circle, ${area.color}33, transparent 65%)`,
          mixBlendMode: 'plus-lighter',
        }}
      />

      {/* Colored left stripe matches the orb dot. Brightens on hover. */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 left-0 z-10 w-1"
        style={{ backgroundColor: area.color }}
        animate={{
          boxShadow: hovered ? `0 0 22px ${area.color}cc` : `0 0 12px ${area.color}55`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Header */}
      <header
        className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border-sub px-7 py-5"
        style={{ background: `linear-gradient(90deg, ${area.color}11, transparent 60%)` }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: area.color, boxShadow: `0 0 8px ${area.color}cc` }}
          />
          <h3 className="font-display text-2xl font-light text-ivory md:text-3xl">
            {area.name}
          </h3>
          {isPreset && (
            <span className="rounded-sm border border-gold/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">
              Core
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <TierBadge tier={content.tier} color={area.color} />
          <div className="text-right">
            <p className="font-display text-2xl font-light leading-none text-gold-lt">
              {latestScore ?? '—'}
              <span className="ml-1 text-xs text-muted">/ 10</span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
              {latestScore === null ? 'Not yet scored' : 'Latest score'}
            </p>
          </div>
        </div>
      </header>

      {/* Tier framing */}
      <div className="relative z-10 px-7 pt-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          {tierLabel(content.tier)}
          <span className="ml-2 normal-case tracking-normal text-muted">
            · {tierSubtitle(content.tier)}
          </span>
        </p>
        <p className="mt-3 max-w-3xl font-display text-lg italic leading-relaxed text-ivory-dim md:text-xl">
          {content.intro}
        </p>
      </div>

      {/* Resource list */}
      <ul className="relative z-10 flex flex-col gap-4 px-7 py-6">
        {content.resources.map((r, i) => (
          <li key={i}>
            <ResourceItem resource={r} accent={area.color} />
          </li>
        ))}
      </ul>

      {/* Per-area reflection journal */}
      <JournalSection
        areaId={area.id}
        areaColor={area.color}
        tier={content.tier}
        initialEntries={journalEntries}
      />

      {/* Teaser for next tier */}
      {teaser && (
        <footer className="relative z-10 border-t border-border-sub bg-black-2/50 px-7 py-4">
          <p className="text-xs text-muted">
            <span className="mr-2 text-gold-lt">→</span>
            {teaser}
          </p>
        </footer>
      )}
    </motion.article>
  );
}

/* ============================================================
   A single resource line. Different rendering per kind.
   ============================================================ */

function ResourceItem({ resource, accent }: { resource: Resource; accent: string }) {
  if (resource.kind === 'video' || resource.kind === 'link') {
    const isVideo = resource.kind === 'video';
    return (
      <a
        href={resource.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-3 rounded-sm border border-border-sub bg-black-2/60 p-3 transition-colors hover:border-border-gold"
      >
        <span
          aria-hidden
          className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm"
          style={{ backgroundColor: `${accent}26`, color: accent }}
        >
          {isVideo ? <PlayIcon /> : <LinkIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
            {isVideo ? 'Video' : 'Read'}
            {resource.source && <span className="ml-2 text-muted">· {resource.source}</span>}
          </p>
          <p className="text-sm leading-snug text-ivory transition-colors group-hover:text-gold-lt md:text-base">
            {resource.body}
          </p>
        </div>
      </a>
    );
  }

  if (resource.kind === 'scripture') {
    return (
      <div
        className="rounded-sm border-l-2 bg-gold/[0.04] py-3 pl-4 pr-4"
        style={{ borderColor: `${accent}aa` }}
      >
        <p className="font-display text-base italic leading-relaxed text-ivory md:text-lg">
          {leadingQuote(resource.body)}
        </p>
        {resource.reference && (
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
            {resource.reference}
          </p>
        )}
      </div>
    );
  }

  if (resource.kind === 'action') {
    return (
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
            Action
          </p>
          <p className="text-sm leading-relaxed text-ivory md:text-base">
            {resource.body}
          </p>
        </div>
      </div>
    );
  }

  if (resource.kind === 'question') {
    return (
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full border border-current opacity-50"
          style={{ color: accent }}
        />
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
            Question to sit with
          </p>
          <p className="text-sm leading-relaxed text-ivory-dim md:text-base">
            {resource.body}
          </p>
        </div>
      </div>
    );
  }

  // reflection
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-sm"
        style={{ backgroundColor: accent, opacity: 0.6 }}
      />
      <div>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
          Reflection
        </p>
        <p className="text-sm leading-relaxed text-silver md:text-base">
          {resource.body}
        </p>
      </div>
    </div>
  );
}

/** Wrap text with proper curly quotes if it does not already have any. */
function leadingQuote(s: string): string {
  if (s.startsWith('“') || s.startsWith('"')) return s;
  return `“${s}”`;
}

/* ============================================================
   Tier badge pill
   ============================================================ */

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M5 3.5v9l7.5-4.5L5 3.5z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M7 9a3 3 0 0 1 0-4l2-2a3 3 0 0 1 4 4l-1 1" strokeLinecap="round" />
      <path d="M9 7a3 3 0 0 1 0 4l-2 2a3 3 0 0 1-4-4l1-1" strokeLinecap="round" />
    </svg>
  );
}

function TierBadge({ tier, color }: { tier: Tier; color: string }) {
  return (
    <span
      className="rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em]"
      style={{
        borderColor: `${color}77`,
        color: color,
        background: `${color}14`,
      }}
    >
      {tierLabel(tier)}
    </span>
  );
}
