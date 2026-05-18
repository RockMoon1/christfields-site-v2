'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav-data';
import { cn } from '@/lib/utils';

/**
 * Hamburger button shown on mobile, plus a slide-in drawer with the same
 * navigation items as the desktop Sidebar. Tapping a link or the backdrop
 * closes the drawer. Lives inside TopBar so it sits in the right place
 * automatically without a layout shuffle.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // The drawer is rendered through a portal to document.body so it cannot be
  // contained by any ancestor's transform/filter/backdrop-filter. Portal
  // must wait for hydration to have a real document to mount into.
  useEffect(() => setMounted(true), []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-sm border border-border-sub text-ivory transition-colors hover:border-border-gold active:bg-black-3 lg:hidden"
      >
        <MenuIcon />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm lg:hidden"
                aria-hidden
              />

              {/* Drawer */}
              <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed inset-y-0 left-0 z-[81] flex w-[280px] max-w-[85vw] flex-col border-r border-border-sub bg-black-2 lg:hidden"
            >
              <div className="flex items-start justify-between border-b border-border-sub px-5 py-5">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <Image
                    src="/assets/logo.png"
                    alt="Christ Fields"
                    width={36}
                    height={36}
                  />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gold">
                      Christ Fields
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                      Dashboard
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-9 w-9 items-center justify-center text-silver transition-colors hover:text-ivory"
                >
                  <CloseIcon />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5">
                <ul className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const active =
                      item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-sm border px-3 py-3 text-sm transition-colors',
                            active
                              ? 'border-border-gold bg-gold/[0.07] text-gold-lt'
                              : 'border-transparent text-silver hover:text-ivory',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 flex-shrink-0 items-center justify-center',
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

              <div className="border-t border-border-sub px-5 py-5">
                <p className="font-display text-sm italic leading-relaxed text-silver">
                  &ldquo;I planted, Apollos watered, but God gave the growth.&rdquo;
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gold">
                  1 Corinthians 3:6
                </p>
              </div>
            </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M3 6h14M3 10h14M3 14h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
