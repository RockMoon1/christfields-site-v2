'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, LEAD_ITEM } from './nav-data';

/**
 * Desktop sidebar. Three items for a member, four for a leader, and nothing
 * else to learn. Hidden under lg; phones get the bottom tab bar.
 */
export function Sidebar({ isLeader = false }: { isLeader?: boolean }) {
  const pathname = usePathname();
  const items = isLeader ? [...NAV_ITEMS.slice(0, 2), LEAD_ITEM, NAV_ITEMS[2]] : NAV_ITEMS;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border-sub bg-black-2 lg:flex">
      <Link
        href="/"
        className="flex items-center gap-3 border-b border-border-sub px-6 py-5 transition-colors hover:bg-black-3"
      >
        <Image src="/assets/logo.png" alt="Christ Fields" width={32} height={32} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Christ Fields</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Our plans</p>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-6">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/e/')
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
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-[44px] items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors',
                    active ? 'text-gold-lt' : 'text-silver hover:text-ivory',
                  )}
                >
                  <span className={cn('flex h-4 w-4 items-center justify-center', active ? 'text-gold' : 'text-muted')}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden w-60 -translate-y-1/2 rounded-sm border border-border-gold bg-black-2 p-3 opacity-0 shadow-2xl transition-opacity duration-200 group-hover:opacity-100 lg:block"
                >
                  <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-gold-lt">
                    {item.label}
                  </span>
                  <span className="mt-1.5 block text-[11px] leading-relaxed text-silver">{item.hint}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </nav>

      {isLeader && (
        <div className="px-3 pb-4">
          <Link
            href="/dashboard/lead/post"
            className="flex min-h-[44px] items-center justify-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-gold-lt"
          >
            Post something
          </Link>
        </div>
      )}
    </aside>
  );
}
