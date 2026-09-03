'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, LEAD_ITEM } from './nav-data';

/**
 * Mobile bottom tab bar. Three tabs for a member, four for a leader. Thumb
 * reachable, safe-area aware, and the whole menu: there is no drawer.
 * Hidden on lg+ where the sidebar takes over.
 */
export function MobileTabBar({ isLeader = false }: { isLeader?: boolean }) {
  const pathname = usePathname();
  const items = isLeader ? [...NAV_ITEMS.slice(0, 2), LEAD_ITEM, NAV_ITEMS[2]] : NAV_ITEMS;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-sub bg-black-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1">
        {items.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/dashboard/e/')
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch
                aria-current={active ? 'page' : undefined}
                className="group relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2"
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
                    'text-[11px] font-medium tracking-[0.04em] transition-colors duration-200',
                    active ? 'text-gold-lt' : 'text-muted',
                  )}
                >
                  {item.label}
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
