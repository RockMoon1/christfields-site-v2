import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
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
}

const TILES: Tile[] = [
  {
    href: '/faithflow',
    badge: 'First group active',
    badgeTone: 'active',
    title: 'FaithFlow',
    body: 'Real, small, in-person groups, with a living member dashboard that grows with you. Scripture first, then your rhythms, prayer, reflection, and your people. Iron sharpening iron, face to face.',
    forWho: 'For people who want a real, in-person church family.',
    access: 'In person and invite-only. Not enrolling right now, but you can ask to be considered below.',
    accessTone: 'invite',
    span: 'md:col-span-4 md:row-span-2',
    big: true,
    glow: 'rgba(45, 106, 79, 0.18)',
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
    glow: 'rgba(196, 123, 60, 0.16)',
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
            <span className="mt-4 inline-block text-[11px] font-medium uppercase tracking-[0.12em] text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Open &rarr;
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
          <p className="mb-3 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            Christ Fields is an invite-only Christian community, with the faith and study tools to
            walk it out together. One door is open right now: early access to ScholarFlow. The
            others open as we grow.
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mb-14 text-sm text-muted">Started and built by Lisandro Pellow.</p>
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
