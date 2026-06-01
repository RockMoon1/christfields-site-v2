'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A signature vertical section rail (desktop only). It tracks which section is
 * in view and lights its marker, reveals the section name on hover, scrolls
 * there on click, and keeps a small "Join" call to action always within reach.
 *
 * Two research goals in one uncommon element: it helps people navigate a long
 * page (so they do not get lost or give up), and it keeps the primary CTA
 * persistently available without cluttering the content. Hidden on touch.
 */

export interface RailSection {
  id: string;
  label: string;
}

const HOME_SECTIONS: RailSection[] = [
  { id: 'home', label: 'Home' },
  { id: 'vision', label: 'Mission' },
  { id: 'walk', label: 'The Walk' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'practices', label: 'Practices' },
  { id: 'day', label: 'A Day' },
  { id: 'scholarflow', label: 'Study' },
  { id: 'projects', label: 'Fields' },
  { id: 'join', label: 'Join' },
];

export function SectionRail({
  sections = HOME_SECTIONS,
  cta = { href: '#join', label: 'Join' },
}: {
  sections?: RailSection[];
  cta?: { href: string; label: string };
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const els = sections.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the viewport middle that is intersecting.
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[visible.length - 1].target.id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:flex lg:flex-col lg:items-end"
    >
      <ul className="flex flex-col items-end gap-3.5">
        {sections.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <a href={`#${s.id}`} className="group flex items-center justify-end gap-3 py-0.5">
                <span
                  className={cn(
                    'text-[10px] font-medium uppercase tracking-[0.18em] transition-all duration-300',
                    on
                      ? 'text-gold-lt opacity-100'
                      : 'text-muted opacity-0 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100',
                  )}
                >
                  {s.label}
                </span>
                <span className="relative flex h-3 w-3 items-center justify-center">
                  {on && (
                    <span className="absolute inset-0 rounded-full border border-gold/50" />
                  )}
                  <span
                    className={cn(
                      'rounded-full transition-all duration-300',
                      on
                        ? 'h-1.5 w-1.5 bg-gold shadow-[0_0_8px_rgba(201,165,72,0.8)]'
                        : 'h-1 w-1 bg-border-sub group-hover:bg-gold/60',
                    )}
                  />
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <a
        href={cta.href}
        className="mt-5 rounded-full border border-border-gold bg-gold/[0.06] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.16em] text-gold-lt transition-colors hover:bg-gold hover:text-black"
      >
        {cta.label}
      </a>
    </nav>
  );
}
