'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-data';
import { isRevealed, type SectionDepth, type SectionKey } from '@/lib/dashboard/journey';

/**
 * Mobile bottom tab bar. App-style quick access to the member's unlocked
 * destinations, so the main places are one tap away with no scrolling. It grows
 * with the journey (same reveal rule as the sidebar) and stays calm: a small
 * set of anchors, never the whole menu. The hamburger in the top bar remains
 * the full menu (Settings, leader area, everything).
 *
 * Hidden on lg+ where the sidebar takes over.
 */

// Short, warm labels for the bar (community reads as "Groups" here, since the
// in-person gathering is the heartbeat we point new members toward first).
const TAB_LABEL: Partial<Record<string, string>> = {
  '/dashboard/today': 'Today',
  '/dashboard/community': 'Community',
};

export function MobileTabBar({
  sections,
  revealAll = false,
}: {
  sections?: Record<SectionKey, SectionDepth>;
  revealAll?: boolean;
}) {
  const pathname = usePathname();

  // Today is always first (the home); then the revealed sections in nav order.
  // Settings and the full Overview live in the menu / behind Today. Cap at five
  // so the bar stays thumb-friendly and uncluttered.
  const candidates = NAV_ITEMS.filter((it) => {
    if (it.href === '/dashboard/today') return true; // Today is the home, always
    if (it.href === '/dashboard') return false; // the full Overview lives behind Today + the menu
    if (it.href === '/dashboard/settings') return false; // lives in the menu
    if (!it.section) return false;
    return revealAll || !sections || isRevealed(sections[it.section]);
  });

  // Community is pinned like Today: the in-person gathering is the heartbeat we
  // point new members toward, and it sits last in nav order, so a plain cap
  // would drop it off the bar exactly as a member grows into more sections.
  const community = candidates.find((it) => it.href === '/dashboard/community');
  const rest = candidates.filter((it) => it !== community);
  const revealedItems = community
    ? [...rest.slice(0, 4), community]
    : rest.slice(0, 5);

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-sub bg-black-2/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1">
        {revealedItems.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const label = TAB_LABEL[item.href] ?? item.label;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch
                aria-current={active ? 'page' : undefined}
                className="group relative flex flex-col items-center gap-1 px-1 py-2.5"
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center transition-colors duration-200',
                    active ? 'text-gold' : 'text-muted group-active:text-silver',
                  )}
                >
                  {item.icon}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-[0.04em] transition-colors duration-200',
                    active ? 'text-gold-lt' : 'text-muted',
                  )}
                >
                  {label}
                </span>
                {active && (
                  <motion.span
                    layoutId="mobile-tab-active"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gold"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
