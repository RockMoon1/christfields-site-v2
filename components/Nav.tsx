'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react';
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

// The nav names what Christ Fields actually offers (FaithFlow, ScholarFlow)
// instead of abstract section labels; the fields map stays reachable by
// scrolling and via the footer's Projects link.
const defaultLinks: NavLink[] = [
  { href: '#vision', label: 'Vision' },
  { href: '/faithflow', label: 'FaithFlow' },
  { href: '/scholarflow', label: 'ScholarFlow' },
  { href: '/journal', label: 'Journal' },
  { href: '/dashboard/sign-in', label: 'Sign in' },
  { href: '#join', label: 'Join the Journey', cta: true },
];

/** Scroll distance over which the bar compresses from 88px to 64px. */
const COMPRESS_RANGE = 120;
/** Don't hide the nav until the reader is at least this far down the page. */
const HIDE_AFTER = 300;

/**
 * Whether a nav link should read as the "current" route. Hash links
 * (in-page anchors) never get a persistent state — the SectionRail owns
 * in-page position. Route links match exactly or as a path prefix, so
 * /journal stays lit while reading /journal/some-post.
 */
function isActiveRoute(href: string, pathname: string): boolean {
  if (href.includes('#') || href.startsWith('mailto:')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Site navigation. Three scroll behaviors layered on the frosted bar:
 *
 * 1. the bar compresses 88px → 64px (logo scaling with it) over the first
 *    120px of scroll, so chrome yields to content as reading begins,
 * 2. past 300px it hides on scroll-down and springs back on scroll-up,
 *    acknowledging reading momentum instead of permanently taxing the
 *    viewport,
 * 3. the gold layoutId underline now also marks the active route
 *    persistently (aria-current), and hover borrows it — springing back
 *    to the current page on mouse leave.
 *
 * The mobile menu is a full-screen overlay that reveals through a
 * clip-path circle growing from the hamburger itself, links rising in a
 * 50ms stagger and mirroring out on close. Body scroll locks while open.
 */
export function Nav({ links = defaultLinks, alwaysScrolled = false }: NavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(alwaysScrolled);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const burgerRef = useRef<HTMLButtonElement>(null);

  const { scrollY } = useScroll();
  const navHeight = useTransform(scrollY, [0, COMPRESS_RANGE], [88, 64]);
  const logoScale = useTransform(scrollY, [0, COMPRESS_RANGE], [1, 0.8]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(alwaysScrolled || latest > 40);
    if (open) {
      setHidden(false);
      return;
    }
    const prev = scrollY.getPrevious() ?? latest;
    if (latest > prev && latest > HIDE_AFTER) setHidden(true);
    else if (latest < prev) setHidden(false);
  });

  // Sync the frosted state on mount (useMotionValueEvent only fires on change).
  useEffect(() => {
    setScrolled(alwaysScrolled || window.scrollY > 40);
  }, [alwaysScrolled]);

  // Close the menu when navigation actually happens.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body scroll-lock + Escape-to-close while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggleMenu = () => {
    if (!open && burgerRef.current) {
      const r = burgerRef.current.getBoundingClientRect();
      setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    setOpen((v) => !v);
    if (!open) setHidden(false);
  };

  // The underline lives under the hovered link, falling back to the
  // active route when the pointer leaves.
  const activeHref = links.find((l) => !l.cta && isActiveRoute(l.href, pathname))?.href ?? null;
  const underlineHref = hovered ?? activeHref;

  // Overlay: clip-path circle growing from the hamburger. Reduced motion
  // gets a plain crossfade — MotionConfig can't neutralize clip-path itself.
  const overlayVariants: Variants = reduceMotion
    ? {
        closed: { opacity: 0, transition: { duration: 0.25, when: 'afterChildren' } },
        open: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
        closed: {
          clipPath: `circle(0% at ${origin.x}px ${origin.y}px)`,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], when: 'afterChildren' },
        },
        open: {
          clipPath: `circle(150% at ${origin.x}px ${origin.y}px)`,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
      };

  const listVariants: Variants = {
    closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
    open: { transition: { staggerChildren: 0.05, delayChildren: 0.18 } },
  };

  const itemVariants: Variants = {
    closed: {
      opacity: 0,
      y: reduceMotion ? 0 : 24,
      transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <>
      <motion.nav
        style={{ height: navHeight }}
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className={cn(
          'fixed inset-x-0 top-0 z-[100] transition-[background,border-color] duration-300',
          scrolled
            ? 'border-b border-border-gold bg-black/90 backdrop-blur-xl'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-full max-w-[1160px] items-center justify-between px-7">
          <Link href="/" className="flex items-center" aria-label="Christ Fields home">
            <motion.div style={{ scale: logoScale, transformOrigin: 'left center' }}>
              <Logo />
            </motion.div>
          </Link>

          <button
            ref={burgerRef}
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="relative z-[110] flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span className={cn('block h-[1.5px] w-5 bg-ivory transition-transform', open && 'translate-y-[7px] rotate-45')} />
            <span className={cn('block h-[1.5px] w-5 bg-ivory transition-opacity', open && 'opacity-0')} />
            <span className={cn('block h-[1.5px] w-5 bg-ivory transition-transform', open && '-translate-y-[7px] -rotate-45')} />
          </button>

          {/* Desktop links */}
          <ul
            onMouseLeave={() => setHovered(null)}
            className="hidden md:flex md:items-center md:gap-9"
          >
            {links.map((link) => {
              const active = isActiveRoute(link.href, pathname);
              return (
                <li
                  key={link.href}
                  // The CTA never carries the underline, so it must not
                  // borrow it either — otherwise hovering it blanks the
                  // active route's persistent marker.
                  onMouseEnter={() => !link.cta && setHovered(link.href)}
                  className="relative"
                >
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative inline-block text-sm font-medium tracking-wide transition-colors',
                      link.cta
                        ? 'rounded-sm border border-gold/45 px-5 py-2 text-xs uppercase tracking-[0.07em] text-gold hover:bg-gold hover:text-black'
                        : active
                          ? 'text-ivory'
                          : 'text-silver hover:text-ivory',
                    )}
                  >
                    {link.label}

                    {/* Sliding gold underline. Rests under the active route
                        and follows hover; the shared layoutId lets it spring
                        between links and back home on mouse leave. */}
                    {!link.cta && underlineHref === link.href && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        aria-hidden
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.nav>

      {/* Mobile menu — full-screen overlay, circle-revealed from the
          hamburger. Sits below the nav bar (z-95 < z-100) so the morphing
          hamburger stays tappable above it. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 z-[95] touch-none bg-black/95 backdrop-blur-2xl md:hidden"
          >
            <motion.ul
              variants={listVariants}
              className="flex h-full flex-col justify-center gap-1 px-8 pt-[var(--nav-h)]"
            >
              {links.map((link) => {
                const active = isActiveRoute(link.href, pathname);
                return (
                  <motion.li
                    key={link.href}
                    variants={itemVariants}
                    className={cn(
                      'border-b border-border-sub py-4',
                      link.cta && 'border-none pt-7',
                    )}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        link.cta
                          ? 'inline-block rounded-sm border border-gold/45 px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black'
                          : cn(
                              'font-display text-4xl font-light leading-tight transition-colors',
                              active ? 'text-gold-lt' : 'text-ivory hover:text-gold-lt',
                            ),
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
