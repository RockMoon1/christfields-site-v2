import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { GlowCard } from '../motion/GlowCard';

/**
 * A bento grid of the three fields Christ Fields is building, as an honest
 * "status and access" map. Each tile says who the field is for and what its real
 * door is right now: open, invite-only, or in development.
 *
 * This was the LLM Council's verdict (2026-06-03) for the public site: first-time
 * visitors could not tell which field was for them or how to actually get in, and
 * the only genuinely open door (ScholarFlow early access) was buried. So every
 * tile now answers "is this for me, and how do I get in?" in plain words, instead
 * of selling a funnel that does not exist yet.
 *
 * Motion: the header uses the shared SectionHeader entrance; tiles are unveiled
 * with the clip-path grammar (Reveal variant="clip") on a light stagger, and the
 * per-tile cursor glow stays. The "Open" affordance is visible at rest on touch
 * and only becomes hover-revealed on pointer devices.
 *
 * This section owns the #projects anchor (nav and footer link to it).
 */

interface Tile {
  href?: string;
  external?: boolean;
  badge?: string;
  badgeTone?: 'active' | 'dev' | 'flagship';
  title: string;
  body: string;
  /** Who this field is for, in one short line. */
  forWho?: string;
  /** The real door right now, in plain words. */
  access?: string;
  accessTone?: 'open' | 'invite' | 'soon';
  /** Grid span classes (desktop). */
  span: string;
  /** Larger title for the hero tile. */
  big?: boolean;
  glow?: string;
  /** Tinted resting surface so the tile pops off the page background. */
  surface?: string;
  /** Per-field border tint (rest + hover). */
  borderClass?: string;
  /** Label for the always-visible action hint (defaults to "Open"). */
  ctaLabel?: string;
}

const TILES: Tile[] = [
  {
    href: '/faithflow',
    badge: 'Community active',
    badgeTone: 'active',
    title: 'FaithFlow',
    body: 'One real, in-person community, Iron and Ember, with small groups within it and a living member dashboard that grows with you. Scripture first, then your rhythms, prayer, reflection, and your people. Iron sharpening iron, face to face.',
    forWho: 'For people who want a real, in-person church family.',
    access: 'In person and invite-only. Joining begins with a real conversation. Ask to be considered below.',
    accessTone: 'invite',
    span: 'md:col-span-4 md:row-span-2',
    big: true,
    glow: 'rgba(45, 106, 79, 0.18)',
    surface: 'linear-gradient(135deg, rgba(45, 106, 79, 0.30) 0%, rgba(13, 20, 16, 0.96) 62%)',
    borderClass: 'border-emerald-lt/30 hover:border-emerald-lt/60',
  },
  {
    badge: 'Two tools live',
    badgeTone: 'flagship',
    title: 'ScholarFlow',
    body: 'A category, not one app: the shelf where our faith and study tools live. GraceFlow and LearnFlow are open now, with more coming.',
    forWho: 'For students and anyone who wants to study faithfully.',
    access: 'Open now. Two apps you can use today.',
    accessTone: 'open',
    span: 'md:col-span-2',
    href: '/scholarflow',
    glow: 'rgba(228, 201, 122, 0.16)',
    surface: 'linear-gradient(135deg, rgba(201, 165, 72, 0.24) 0%, rgba(19, 16, 10, 0.96) 62%)',
    borderClass: 'border-gold/35 hover:border-gold/70',
  },
  {
    badge: 'In development',
    badgeTone: 'dev',
    title: 'OSINT & Trace',
    body: 'Open-source intelligence software to help find missing people. Technical skill in service of the lost.',
    forWho: 'Built to help find the missing, in service of others.',
    access: 'In development. Ask below to be notified.',
    accessTone: 'soon',
    span: 'md:col-span-2',
    href: '#join',
    glow: 'rgba(196, 123, 60, 0.16)',
    surface: 'linear-gradient(135deg, rgba(196, 123, 60, 0.20) 0%, rgba(18, 13, 9, 0.96) 62%)',
    borderClass: 'border-[#c47b3c]/30 hover:border-[#c47b3c]/60',
    ctaLabel: 'Get notified',
  },
];

const badgeStyles: Record<NonNullable<Tile['badgeTone']>, string> = {
  active: 'border-emerald-lt/40 bg-emerald-lt/15 text-emerald-bright',
  flagship: 'border-gold/40 bg-gold/15 text-gold-lt',
  dev: 'border-border-sub bg-black-4 text-silver',
};

// Honest "door" colour cue: open = green, invite-only = gold, in development = grey.
const accessDot: Record<NonNullable<Tile['accessTone']>, string> = {
  open: 'bg-emerald-lt',
  invite: 'bg-gold',
  soon: 'bg-silver',
};

const accessText: Record<NonNullable<Tile['accessTone']>, string> = {
  open: 'text-emerald-bright',
  invite: 'text-gold-lt',
  soon: 'text-silver',
};

function TileInner({ tile }: { tile: Tile }) {
  return (
    <GlowCard
      glowColor={tile.glow}
      className={`group h-full rounded-md border shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition-[border-color,transform] duration-300 hover:-translate-y-1 ${
        tile.borderClass ?? 'border-border-sub hover:border-border-gold'
      }`}
      style={{ background: tile.surface ?? 'var(--color-black-2, #101512)' }}
    >
      <div className="flex h-full flex-col p-7 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-gold-lt to-transparent opacity-0 transition duration-500 group-hover:scale-x-100 group-hover:opacity-100"
        />
        {tile.badge && (
          <span
            className={`mb-4 inline-block w-fit rounded-sm border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] ${
              badgeStyles[tile.badgeTone ?? 'dev']
            }`}
          >
            {tile.badge}
          </span>
        )}
        <h3
          className={`font-display font-light text-ivory ${
            tile.big ? 'text-3xl md:text-4xl' : 'text-2xl'
          }`}
        >
          {tile.title}
        </h3>
        <p
          className={`mt-3 leading-relaxed text-ivory-dim ${
            tile.big ? 'max-w-md text-base' : 'text-sm'
          }`}
        >
          {tile.body}
        </p>

        {/* Honest status + access: who it's for and the real door right now. */}
        <div className="mt-auto pt-6">
          {tile.forWho && <p className="text-xs leading-relaxed text-silver">{tile.forWho}</p>}
          {tile.access && (
            <p className="mt-2 flex items-start gap-2 text-xs font-medium leading-relaxed">
              <span
                aria-hidden
                className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${accessDot[tile.accessTone ?? 'soon']}`}
              />
              <span className={accessText[tile.accessTone ?? 'soon']}>{tile.access}</span>
            </p>
          )}
          {tile.href && (
            // Always visible: these tiles are the doors to each field's page,
            // so the action hint must not hide behind hover.
            <span className="mt-4 inline-block text-[11px] font-medium uppercase tracking-[0.12em] text-gold transition-transform duration-300 group-hover:translate-x-0.5">
              {tile.ctaLabel ?? 'Open'} &rarr;
            </span>
          )}
        </div>
      </div>
    </GlowCard>
  );
}

function TileShell({ tile, children }: { tile: Tile; children: ReactNode }) {
  // The grid span lives on the Reveal wrapper (the grid item). This shell just
  // fills that item's height, as a link when the tile navigates somewhere.
  if (!tile.href) {
    return <div className="h-full">{children}</div>;
  }
  return (
    <Link href={tile.href} prefetch className="block h-full">
      {children}
    </Link>
  );
}

export function BentoGrid() {
  return (
    <section id="projects" className="py-[110px]">
      <Container>
        <SectionHeader
          align="left"
          eyebrow="One company, many fields"
          title={
            <>
              The <em className="not-italic text-gold-lt">whole field.</em>
            </>
          }
          lede="Christ Fields is an invite-only Christian community, with the faith and study tools to walk it out together. One door is open right now: the ScholarFlow tools. The others open as we grow."
        />
        <Reveal delay={0.4}>
          <p className="mt-3 text-sm text-muted">Started and built by Lisandro Pellow.</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[minmax(190px,1fr)]">
          {TILES.map((tile, i) => (
            <Reveal
              key={tile.title}
              variant="clip"
              delay={Math.min(i * 0.09, 0.36)}
              className={tile.span}
            >
              <TileShell tile={tile}>
                <TileInner tile={tile} />
              </TileShell>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
