import {
  getResourcesForArea,
  nextTierTeaser,
  tierLabel,
  tierSubtitle,
  type Resource,
  type Tier,
} from '@/lib/resources';
import type { AreaWithEntries } from '@/app/dashboard/(app)/progress/actions';

interface ResourceCardProps {
  area: AreaWithEntries;
}

/**
 * A single area's resource card on /dashboard/resources. Pulls the right
 * tier of content based on the user's most recent score and renders it.
 * Color stripe and dot match the orb dot for that area.
 */
export function ResourceCard({ area }: ResourceCardProps) {
  const latest = area.entries[area.entries.length - 1];
  const latestScore = latest?.score ?? null;
  const content = getResourcesForArea({
    presetKey: area.presetKey,
    areaName: area.name,
    latestScore,
  });
  const teaser = nextTierTeaser(content.tier);
  const isPreset = !!area.presetKey;

  return (
    <article className="group relative overflow-hidden rounded-sm border border-border-sub bg-black-3 transition-colors hover:border-border-gold">
      {/* Colored left stripe matches the orb dot */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: area.color, boxShadow: `0 0 12px ${area.color}55` }}
      />

      {/* Header */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border-sub px-7 py-5"
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
      <div className="px-7 pt-6">
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
      <ul className="flex flex-col gap-4 px-7 py-6">
        {content.resources.map((r, i) => (
          <li key={i}>
            <ResourceItem resource={r} accent={area.color} />
          </li>
        ))}
      </ul>

      {/* Teaser for next tier */}
      {teaser && (
        <footer className="border-t border-border-sub bg-black-2/50 px-7 py-4">
          <p className="text-xs text-muted">
            <span className="mr-2 text-gold-lt">→</span>
            {teaser}
          </p>
        </footer>
      )}
    </article>
  );
}

/* ============================================================
   A single resource line. Different rendering per kind.
   ============================================================ */

function ResourceItem({ resource, accent }: { resource: Resource; accent: string }) {
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
