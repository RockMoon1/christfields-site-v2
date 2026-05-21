'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * FaithFlow leader navigation. A fixed vertical rail on desktop, a simple
 * horizontal strip on smaller screens (the leader dashboard is desktop and
 * iPad first). Active tab gets an animated gold pill. Masters also get a link
 * up to the oversight tier.
 */

const TABS = [
  { href: '/dashboard/leader', label: 'Group', icon: <GroupIcon /> },
  { href: '/dashboard/leader/members', label: 'Members', icon: <MembersIcon /> },
  { href: '/dashboard/leader/roster', label: 'Roster', icon: <RosterIcon /> },
];

function isActive(href: string, pathname: string) {
  return href === '/dashboard/leader' ? pathname === href : pathname.startsWith(href);
}

export function LeaderNav({ isMaster = false }: { isMaster?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border-sub bg-black/60 lg:flex">
        <div className="border-b border-border-sub px-6 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gold">
            FaithFlow
          </p>
          <p className="font-display text-2xl font-light text-ivory">Leader</p>
        </div>

        <nav className="flex-1 px-3 py-6">
          <ul className="flex flex-col gap-1">
            {TABS.map((t) => {
              const active = isActive(t.href, pathname);
              return (
                <li key={t.href} className="relative">
                  {active && (
                    <motion.div
                      layoutId="leader-active-pill"
                      className="absolute inset-0 rounded-sm border border-border-gold bg-gold/[0.07]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Link
                    href={t.href}
                    prefetch
                    className={cn(
                      'relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors',
                      active ? 'text-gold-lt' : 'text-silver hover:text-ivory',
                    )}
                  >
                    <span className={cn('flex h-4 w-4 items-center justify-center', active ? 'text-gold' : 'text-muted')}>
                      {t.icon}
                    </span>
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-border-sub px-3 py-4">
          {isMaster && (
            <Link
              href="/dashboard/master"
              className="flex items-center gap-3 rounded-sm border border-border-gold bg-gold/[0.06] px-3 py-2.5 text-sm text-gold-lt transition-colors hover:bg-gold/[0.12]"
            >
              <span className="flex h-4 w-4 items-center justify-center text-gold">
                <CrownIcon />
              </span>
              Master oversight
            </Link>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-silver transition-colors hover:text-ivory"
          >
            <span className="flex h-4 w-4 items-center justify-center text-muted">
              <BackIcon />
            </span>
            My dashboard
          </Link>
        </div>

        <div className="border-t border-border-sub px-6 py-5">
          <p className="font-display text-sm italic leading-relaxed text-silver">
            &ldquo;Shepherd the flock of God that is among you.&rdquo;
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gold">1 Peter 5:2</p>
        </div>
      </aside>

      {/* Mobile / iPad strip */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border-sub bg-black/70 px-3 py-2 lg:hidden">
        {TABS.map((t) => {
          const active = isActive(t.href, pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] transition-colors',
                active ? 'border border-border-gold bg-gold/[0.07] text-gold-lt' : 'text-silver hover:text-ivory',
              )}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
        {isMaster && (
          <Link
            href="/dashboard/master"
            className="flex shrink-0 items-center rounded-sm border border-border-gold px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-gold-lt"
          >
            Master
          </Link>
        )}
        <Link
          href="/dashboard"
          className="ml-auto flex shrink-0 items-center rounded-sm px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-silver hover:text-ivory"
        >
          Exit
        </Link>
      </nav>
    </>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
      <circle cx="3.8" cy="10" r="1.3" fill="currentColor" />
      <circle cx="12.2" cy="10" r="1.3" fill="currentColor" />
    </svg>
  );
}
function MembersIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="6" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 13c0-2 1.6-3.5 3.5-3.5S9.5 11 9.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.5 4a2 2 0 010 4M11 9.6c1.6.2 2.8 1.6 2.8 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function RosterIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path d="M9 4L5 8l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CrownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M2.5 5.5l2.5 2 3-3.5 3 3.5 2.5-2-1 6.5h-9l-1-6.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
