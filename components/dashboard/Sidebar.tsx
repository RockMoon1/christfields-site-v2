'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const items: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: <DotIcon /> },
  { href: '/dashboard/progress', label: 'Progress', icon: <BarIcon /> },
  { href: '/dashboard/photos', label: 'Photos', icon: <PhotoIcon /> },
  { href: '/dashboard/notes', label: 'Notes', icon: <NoteIcon /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <GearIcon /> },
];

/**
 * Left sidebar for the dashboard. Sticky, dark, with brand logo at top.
 * Active nav item gets a gold pill background that animates between items
 * via layoutId. Same trick used in the main site nav.
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
          {items.map((item) => {
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

/* ============================================================
   Inline SVG icons. Small, stroke-based, very thin so they
   match the editorial feel of the brand.
   ============================================================ */

function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}
function BarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path d="M2 12V8M6 12V4M10 12V6M14 12V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function PhotoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <path d="M2 11l3-3 3 3 4-4 3 3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function NoteIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
