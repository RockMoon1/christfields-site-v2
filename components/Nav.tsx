'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  cta?: boolean;
}

interface NavProps {
  /** Links to render in the nav. Defaults to the home page nav. */
  links?: NavLink[];
  /** Whether nav should always have the scrolled (frosted) background. */
  alwaysScrolled?: boolean;
}

const defaultLinks: NavLink[] = [
  { href: '#vision', label: 'Vision' },
  { href: '#projects', label: 'Projects' },
  { href: '/journal', label: 'Journal' },
  { href: '#join', label: 'Join the Journey', cta: true },
];

export function Nav({ links = defaultLinks, alwaysScrolled = false }: NavProps) {
  const [scrolled, setScrolled] = useState(alwaysScrolled);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (alwaysScrolled) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [alwaysScrolled]);

  return (
    <nav
      className={cn(
        'fixed inset-x-0 top-0 z-[100] h-[var(--nav-h)] transition-[background,border-color] duration-300',
        scrolled
          ? 'border-b border-border-gold bg-black/90 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-full max-w-[1160px] items-center justify-between px-7">
        <Link href="/" className="flex items-center" aria-label="Christ Fields home">
          <Logo />
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex flex-col gap-1.5 p-1.5 md:hidden"
        >
          <span className={cn('block h-[1.5px] w-5 bg-ivory transition-transform', open && 'translate-y-[7px] rotate-45')} />
          <span className={cn('block h-[1.5px] w-5 bg-ivory transition-opacity', open && 'opacity-0')} />
          <span className={cn('block h-[1.5px] w-5 bg-ivory transition-transform', open && '-translate-y-[7px] -rotate-45')} />
        </button>

        <ul
          onMouseLeave={() => setHovered(null)}
          className={cn(
            'fixed inset-x-0 top-[var(--nav-h)] flex flex-col gap-0 border-b border-border-gold bg-black/95 px-7 py-6 backdrop-blur-xl transition-transform md:static md:flex-row md:items-center md:gap-9 md:border-none md:bg-transparent md:p-0 md:backdrop-blur-none md:transition-none',
            open ? 'translate-y-0' : '-translate-y-[120%] md:translate-y-0',
          )}
        >
          {links.map((link) => (
            <li
              key={link.href}
              onMouseEnter={() => setHovered(link.href)}
              className="relative border-b border-border-sub py-4 md:border-none md:py-0"
            >
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'relative inline-block text-sm font-medium tracking-wide transition-colors',
                  link.cta
                    ? 'rounded-sm border border-gold/45 px-5 py-2 text-xs uppercase tracking-[0.07em] text-gold hover:bg-gold hover:text-black'
                    : 'text-silver hover:text-ivory',
                )}
              >
                {link.label}

                {/* Sliding gold underline. Only for non-CTA links. The
                    layoutId shares the element across siblings so it
                    smoothly animates between them on hover. */}
                {!link.cta && hovered === link.href && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 hidden h-px bg-gold md:block"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    aria-hidden
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
