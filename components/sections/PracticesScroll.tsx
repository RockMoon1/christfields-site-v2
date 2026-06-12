'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { motion, useMotionValue } from 'motion/react';
import { cn } from '@/lib/utils';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { SectionSpotlight } from '../motion/SectionSpotlight';

/**
 * A horizontal-scroll showcase of the five practices the walk is built on (the
 * same areas the member dashboard tracks). Native scroll-snap so it is reliable
 * on touch, trackpad, and mouse, edge-faded so cards emerge and dissolve, with a
 * cursor spotlight on the section behind it.
 *
 * The rail acknowledges the reader's position three ways: a gold progress
 * hairline scrubs under the cards (driven by scrollLeft through a motion value,
 * no per-frame React state), the snapped card lifts slightly with a gold
 * border (IntersectionObserver inside the scroller), and desktop mouse users
 * can grab and drag the rail directly. The "Scroll" hint stays visible on
 * mobile, where it matters most.
 */

interface Practice {
  name: string;
  line: string;
  body: string;
  ref: string;
  color: string;
}

const PRACTICES: Practice[] = [
  {
    name: 'Presence',
    line: 'Show up, in person.',
    body: 'The gathering is the heartbeat, not the screen. Community needs your presence, not just your attention.',
    ref: 'Hebrews 10:25',
    color: '#c9a548',
  },
  {
    name: 'Honesty',
    line: 'The truth about your week.',
    body: 'You cannot fake your way through a group like this. The people next to you eventually know, and that is the point.',
    ref: 'Psalm 51:6',
    color: '#2d6a4f',
  },
  {
    name: 'Scripture',
    line: 'Sit under the Word.',
    body: 'Read slowly, together. Let Scripture be bigger than a single verse, and let it read you back.',
    ref: 'Psalm 119:105',
    color: '#e4c97a',
  },
  {
    name: 'Prayer',
    line: 'Bring him everything.',
    body: 'Not to twist his arm, but to hand it to one who is good. Praying for each other by name changes things.',
    ref: 'Philippians 4:6',
    color: '#5b8db8',
  },
  {
    name: 'Sharpening',
    line: 'Push each other forward.',
    body: 'As iron sharpens iron, so one person sharpens another. Friction, sometimes. Always toward growth.',
    ref: 'Proverbs 27:17',
    color: '#c47b3c',
  },
];

export function PracticesScroll() {
  const railRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startLeft: number } | null>(null);
  const progress = useMotionValue(0);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  /** Mirrors scrollLeft into the progress motion value — no setState per frame. */
  function syncProgress() {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    progress.set(max > 0 ? el.scrollLeft / max : 0);
  }

  // The snapped card: a thin detection band near the rail's left edge (where
  // snap-start parks cards). Fires only when a card crosses the band, so the
  // emphasis updates on snap changes rather than every scroll frame.
  useEffect(() => {
    const root = railRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-practice]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.practice));
          }
        }
      },
      { root, rootMargin: '0px -82% 0px -4%', threshold: 0 },
    );
    cards.forEach((card) => io.observe(card));
    return () => io.disconnect();
  }, []);

  /** Drag-to-scroll for desktop mouse users; touch keeps native scrolling. */
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;
    dragState.current = { startX: e.clientX, startLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = railRef.current;
    const d = dragState.current;
    if (!el || !d) return;
    el.scrollLeft = d.startLeft - (e.clientX - d.startX);
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    dragState.current = null;
    railRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
  }

  return (
    <section id="practices" className="relative overflow-hidden py-[110px]">
      <SectionSpotlight color="rgba(201, 165, 72, 0.08)" size={520} />

      <Container>
        <SectionHeader
          align="left"
          eyebrow="What the walk is made of"
          title={
            <>
              Five <em className="not-italic text-gold-lt">practices.</em>
            </>
          }
          lede={
            <span className="flex flex-wrap items-center gap-3">
              The ordinary things we keep returning to. Faithfulness, not perfection.
              {/* Visible on every viewport — touch users need this hint the most. */}
              <span
                aria-hidden
                className="whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-muted"
              >
                Scroll &rarr;
              </span>
            </span>
          }
          className="mb-10"
        />
      </Container>

      {/* Edge-faded horizontal scroller. */}
      <div
        className="relative"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        }}
      >
        <div
          ref={railRef}
          onScroll={syncProgress}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            'flex gap-5 overflow-x-auto px-7 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:cursor-grab',
            // Snap releases while dragging so the rail follows the cursor 1:1,
            // then re-engages on release and settles on the nearest card.
            dragging ? 'snap-none cursor-grabbing select-none' : 'snap-x snap-mandatory',
          )}
        >
          {PRACTICES.map((p, i) => (
            <Reveal
              key={p.name}
              variant="clip"
              delay={Math.min(i * 0.06, 0.3)}
              className="shrink-0 snap-start"
            >
              <article
                data-practice={i}
                className={cn(
                  'group relative flex h-full w-[78vw] flex-col overflow-hidden rounded-md border bg-black-2 p-8 transition-[transform,border-color] duration-500 sm:w-[20rem]',
                  active === i
                    ? 'scale-[1.02] border-gold/60'
                    : 'border-border-sub hover:border-border-gold',
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 16px ${p.color}66` }}
                />
                <span
                  aria-hidden
                  className="mb-6 inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 12px ${p.color}` }}
                />
                <h3 className="font-display text-3xl font-light text-ivory">{p.name}</h3>
                <p className="mt-2 font-display text-lg italic text-ivory-dim">{p.line}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-silver">{p.body}</p>
                <p
                  className="mt-6 text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: p.color }}
                >
                  {p.ref}
                </p>
              </article>
            </Reveal>
          ))}
          {/* Tail spacer so the last card can snap clear of the right edge. */}
          <span aria-hidden className="block w-2 shrink-0" />
        </div>
      </div>

      {/* Scrub progress hairline — gold fill tracks the rail's position. */}
      <Container>
        <div aria-hidden className="relative mt-2 h-px w-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full w-full origin-left bg-gradient-to-r from-gold to-gold-lt shadow-[0_0_8px_rgba(201,165,72,0.45)]"
            style={{ scaleX: progress }}
          />
        </div>
      </Container>
    </section>
  );
}
