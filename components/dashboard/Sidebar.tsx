'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-data';

/**
 * Desktop sidebar for the dashboard. Sticky, dark, with brand logo at top.
 * Active nav item gets a gold pill background that animates between items
 * via layoutId, same trick as the main site nav.
 *
 * Hidden under lg breakpoint — mobile users get the MobileNav drawer
 * inside TopBar instead.
 */
export function Sidebar() {
  const pathname = usePathname();

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
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Dashboard
          </p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="relative">
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
              </li>
            );
          })}
        </ul>
      </nav>

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
