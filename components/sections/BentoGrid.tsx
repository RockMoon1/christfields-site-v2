import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { GlowCard } from '../motion/GlowCard';

/**
 * A bento grid of everything Christ Fields is building. Asymmetric tiles, each
 * with a cursor-following glow and a hover lift, so the whole ecosystem reads in
 * one premium glance: the live member dashboard (the hero tile), FaithFlow,
 * ScholarFlow, the work in service of others, and the Journal.
 */

interface Tile {
  href?: string;
  external?: boolean;
  badge?: string;
  badgeTone?: 'active' | 'dev' | 'flagship';
  title: string;
  body: string;
  /** Grid span classes (desktop). */
  span: string;
  /** Larger title for the hero tile. */
  big?: boolean;
  glow?: string;
}

const TILES: Tile[] = [
  {
    href: '/faithflow',
    badge: 'First group active',
    badgeTone: 'active',
    title: 'FaithFlow',
    body: 'Real, small, in-person groups, with a living member dashboard that grows with you. Scripture first, then your rhythms, prayer, reflection, and your people. Iron sharpening iron, face to face.',
    span: 'md:col-span-4 md:row-span-2',
    big: true,
    glow: 'rgba(45, 106, 79, 0.18)',
  },
  {
    href: '/#scholarflow',
    badge: 'Flagship',
    badgeTone: 'flagship',
    title: 'ScholarFlow',
    body: 'Study, sharpened. Tools that help you think clearly and learn faithfully.',
    span: 'md:col-span-2',
    glow: 'rgba(228, 201, 122, 0.16)',
  },
  {
    badge: 'In development',
    badgeTone: 'dev',
    title: 'OSINT & Trace',
    body: 'Open-source intelligence software to help find missing people. Technical skill in service of the lost.',
    span: 'md:col-span-2',
    glow: 'rgba(196, 123, 60, 0.16)',
  },
];

const badgeStyles: Record<NonNullable<Tile['badgeTone']>, string> = {
  active: 'border-emerald-lt/40 bg-emerald-lt/15 text-emerald-bright',
  flagship: 'border-gold/40 bg-gold/15 text-gold-lt',
  dev: 'border-border-sub bg-black-4 text-silver',
};

function TileInner({ tile }: { tile: Tile }) {
  return (
    <GlowCard
      glowColor={tile.glow}
      className="group h-full rounded-md border border-border-sub bg-black-2 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-border-gold"
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
        {tile.href && (
          <span className="mt-auto pt-6 text-[11px] font-medium uppercase tracking-[0.12em] text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Open &rarr;
          </span>
        )}
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
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            One company, many fields
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            The <em className="not-italic text-gold-lt">whole field.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            Everything we are building serves a real need, made carefully, without rushing. It all
            grows from the same root.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[minmax(190px,1fr)]">
          {TILES.map((tile, i) => (
            <Reveal key={tile.title} delay={Math.min(i * 0.06, 0.3)} className={tile.span}>
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
