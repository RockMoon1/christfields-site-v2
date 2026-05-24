'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-data';
import { isRevealed, type SectionDepth, type SectionKey } from '@/lib/dashboard/journey';
import { RevealToggle } from './RevealToggle';

/**
 * Desktop sidebar for the dashboard. Sticky, dark, with brand logo at top.
 * Active nav item gets a gold pill background that animates between items.
 *
 * Each item has a hover tooltip that briefly explains what the section is and
 * why to use it, so a new member can learn the dashboard by exploring rather
 * than sitting through a forced tour.
 *
 * Leaders (org admins) also get a "FaithFlow Leader" entry. Members never see
 * it. Hidden under lg breakpoint; mobile users get the MobileNav drawer.
 */
export function Sidebar({
  isLeader = false,
  sections,
  revealAll = false,
}: {
  isLeader?: boolean;
  sections?: Record<SectionKey, SectionDepth>;
  revealAll?: boolean;
}) {
  const pathname = usePathname();

  // Reveal items progressively: an item with a section shows once the journey
  // reaches it, or whenever the member has chosen to see everything. Items with
  // no section (Overview, Settings) are always present. If we have no journey
  // data (a degraded load), show everything rather than hide.
  const items = NAV_ITEMS.filter(
    (it) => !it.section || revealAll || !sections || isRevealed(sections[it.section]),
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border-sub bg-black-2 lg:flex">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 border-b border-border-sub px-6 py-5 transition-colors hover:bg-black-3"
      >
        <Image src="/assets/logo.png" alt="Christ Fields" width={32} height={32} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gold">
            Christ Fields
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Dashboard</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="group relative">
                {active && (
                  <motion.div
                    layoutId="dash-active-pill"
                    className="absolute inset-0 rounded-sm border border-border-gold bg-gold/[0.07]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors',
                    active ? 'text-gold-lt' : 'text-silver hover:text-ivory',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center transition-colors',
                      active ? 'text-gold' : 'text-muted',
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
                <NavTooltip label={item.label} hint={item.hint} />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Leader-only entry into the FaithFlow leader area */}
      {isLeader && (
        <div className="group relative px-3 pb-2">
          <Link
            href="/dashboard/leader"
            className="flex items-center gap-3 rounded-sm border border-border-gold bg-gold/[0.06] px-3 py-2.5 text-sm text-gold-lt transition-colors hover:bg-gold/[0.12]"
          >
            <span className="flex h-4 w-4 items-center justify-center text-gold">
              <LeaderIcon />
            </span>
            FaithFlow Leader
          </Link>
          <NavTooltip
            label="FaithFlow Leader"
            hint="Lead your group. See how each person is walking and find prayerful ways to shepherd them."
          />
        </div>
      )}

      {/* Always available: what we stand for + show everything */}
      <div className="border-t border-border-sub px-3 py-3">
        <Link
          href="/dashboard/foundation"
          className={cn(
            'flex items-center gap-2.5 rounded-sm px-3 py-2 text-xs transition-colors',
            pathname.startsWith('/dashboard/foundation')
              ? 'text-gold-lt'
              : 'text-muted hover:text-silver',
          )}
        >
          <span className="flex h-4 w-4 items-center justify-center">
            <FoundationIcon />
          </span>
          What we stand for
        </Link>
        <RevealToggle revealAll={revealAll} />
      </div>

      {/* Footer scripture */}
      <div className="border-t border-border-sub px-6 py-5">
        <p className="font-display text-sm italic leading-relaxed text-silver">
          &ldquo;I planted, Apollos watered, but God gave the growth.&rdquo;
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gold">
          1 Corinthians 3:6
        </p>
      </div>
    </aside>
  );
}

/**
 * Hover card that explains a nav item. Pure CSS (group-hover), so it costs
 * nothing and never blocks clicks. Appears to the right of the rail.
 */
function NavTooltip({ label, hint }: { label: string; hint: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden w-60 -translate-y-1/2 rounded-sm border border-border-gold bg-black-2 p-3 opacity-0 shadow-2xl transition-opacity duration-200 group-hover:opacity-100 lg:block"
    >
      <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-gold-lt">
        {label}
      </span>
      <span className="mt-1.5 block text-[11px] leading-relaxed text-silver">{hint}</span>
    </span>
  );
}

function LeaderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="3.6" r="1.2" fill="currentColor" />
      <circle cx="3.9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="12.1" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

function FoundationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path d="M8 2.5l5 2.2-5 2.2-5-2.2 5-2.2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M3 8l5 2.2L13 8M3 11l5 2.2L13 11" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}
