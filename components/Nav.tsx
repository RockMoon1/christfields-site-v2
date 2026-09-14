'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

interface NavLink { href: string; label: string; cta?: boolean }
interface NavProps { links?: NavLink[]; alwaysScrolled?: boolean }

const defaultLinks: NavLink[] = [
  { href: '#vision', label: 'Vision' },
  { href: '/faithflow', label: 'FaithFlow' },
  { href: '/scholarflow', label: 'ScholarFlow' },
  { href: '/journal', label: 'Journal' },
  { href: '/dashboard/sign-in', label: 'Sign in' },
  { href: '#join', label: 'Join the Journey', cta: true },
];

function isActiveRoute(href: string, pathname: string): boolean {
  if (href.includes('#') || href.startsWith('mailto:')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Public navigation keeps its scroll compression and active-route marker.
 * Keyboard focus always brings the bar into view. A native modal dialog
 * makes the background inert and contains focus in compact navigation.
 */
export function Nav({ links = defaultLinks, alwaysScrolled = false }: NavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(alwaysScrolled);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const { scrollY } = useScroll();
  const navHeight = useTransform(scrollY, [0, 120], [88, 64]);
  const logoScale = useTransform(scrollY, [0, 120], [1, 0.8]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(alwaysScrolled || latest > 40);
    if (open || hasFocus || reduceMotion) { setHidden(false); return; }
    const prev = scrollY.getPrevious() ?? latest;
    if (latest > prev && latest > 300) setHidden(true);
    else if (latest < prev) setHidden(false);
  });

  useEffect(() => { setScrolled(alwaysScrolled || window.scrollY > 40); }, [alwaysScrolled]);
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    firstLinkRef.current?.focus({ preventScroll: true });
    // Resizing a tablet must not leave an invisible modal over desktop links.
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', onResize);
    onResize();
    return () => {
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
      desktop.removeEventListener('change', onResize);
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function closeMenu(restoreFocus = true) {
    dialogRef.current?.close();
    setOpen(false);
    setHidden(false);
    if (restoreFocus) burgerRef.current?.focus({ preventScroll: true });
  }

  function followLink(href: string) {
    closeMenu(false);
    const url = new URL(href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash) return;
    // Same-page anchors are handled by ScrollToTop. Move focus too, after
    // the modal releases its background, so Tab follows the chosen section.
    requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      const previousTabIndex = target.getAttribute('tabindex');
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      target.addEventListener('blur', () => {
        if (previousTabIndex === null) target.removeAttribute('tabindex');
        else target.setAttribute('tabindex', previousTabIndex);
      }, { once: true });
    });
  }

  const activeHref = links.find((link) => !link.cta && isActiveRoute(link.href, pathname))?.href ?? null;
  const underlineHref = focused ?? hovered ?? activeHref;

  return (
    <>
      <motion.nav
        aria-label="Main navigation"
        style={{ height: reduceMotion ? 88 : navHeight }}
        animate={{ y: hidden && !hasFocus && !reduceMotion ? '-110%' : '0%' }}
        transition={reduceMotion || hasFocus ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onFocusCapture={() => { setHasFocus(true); setHidden(false); }}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false); }}
        className={cn('fixed inset-x-0 top-0 z-[100] transition-[background,border-color] duration-200',
          scrolled ? 'border-b border-border-gold bg-black/90 backdrop-blur-xl' : 'border-b border-transparent')}
      >
        <div className="mx-auto flex h-full max-w-[1160px] items-center justify-between px-6 md:px-7">
          <Link href="/" className="flex min-h-11 items-center" aria-label="Christ Fields home">
            <motion.div style={{ scale: reduceMotion ? 1 : logoScale, transformOrigin: 'left center' }}><Logo /></motion.div>
          </Link>
          <button ref={burgerRef} type="button" onClick={() => { setHidden(false); setOpen(true); }}
            aria-label="Open menu" aria-expanded={open} aria-controls="public-navigation-menu" aria-haspopup="dialog"
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-sm lg:hidden">
            <span aria-hidden className="block h-[1.5px] w-5 bg-ivory" />
            <span aria-hidden className="block h-[1.5px] w-5 bg-ivory" />
            <span aria-hidden className="block h-[1.5px] w-5 bg-ivory" />
          </button>
          <ul onMouseLeave={() => setHovered(null)} className="hidden items-center gap-7 lg:flex">
            {links.map((link) => {
              const active = isActiveRoute(link.href, pathname);
              return (
                <li key={link.href} onMouseEnter={() => !link.cta && setHovered(link.href)} className="relative">
                  <Link href={link.href} onFocus={() => !link.cta && setFocused(link.href)} onBlur={() => setFocused(null)}
                    aria-current={active ? 'page' : undefined}
                    className={cn('relative inline-flex min-h-11 items-center text-sm font-medium tracking-wide transition-colors duration-200',
                      link.cta ? 'rounded-sm border border-gold/45 px-5 py-2 uppercase tracking-[0.07em] text-gold hover:bg-gold hover:text-black focus-visible:bg-gold focus-visible:text-black'
                        : active ? 'text-ivory' : 'text-silver hover:text-ivory focus-visible:text-ivory')}>
                    {link.label}
                    {!link.cta && underlineHref === link.href && (
                      <motion.span layoutId="nav-underline" className="absolute bottom-1 inset-x-0 h-px bg-gold"
                        transition={reduceMotion || focused ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }} aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.nav>

      <dialog ref={dialogRef} id="public-navigation-menu" aria-labelledby="public-navigation-title"
        onCancel={(event) => { event.preventDefault(); closeMenu(); }} onClose={() => setOpen(false)} data-lenis-prevent
        onKeyDown={(event) => {
          if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
          // Native modal focus cannot enter the page, but Chromium can move
          // from its last control to browser chrome. Keep the menu's cycle
          // explicit so each Tab press stays on one of its visible controls.
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
            .filter((control) => control.tabIndex >= 0 && control.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (!first || !last) return;
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-black p-0 text-ivory backdrop:bg-black/70 lg:hidden">
        <div className="sticky top-0 z-10 bg-black pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-[88px] max-w-[1160px] items-center justify-between px-6 md:px-7">
            <h2 id="public-navigation-title" className="font-body text-meta font-medium uppercase tracking-[0.2em] text-gold">Menu</h2>
            <button type="button" onClick={() => closeMenu()}
              className="inline-flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm text-ivory transition-colors duration-200 hover:text-gold-lt focus-visible:text-gold-lt">
              Close
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
        </div>
        <nav aria-label="Menu links" className="mx-auto max-w-2xl px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
          <ul>
            {links.map((link, index) => {
              const active = isActiveRoute(link.href, pathname);
              return (
                <li key={link.href} className={cn('border-b border-border-sub py-3', link.cta && 'border-none pt-7')}>
                  <Link ref={index === 0 ? firstLinkRef : undefined} href={link.href} onClick={() => followLink(link.href)}
                    aria-current={active ? 'page' : undefined}
                    className={cn('inline-flex min-h-11 items-center transition-colors duration-200',
                      link.cta ? 'rounded-sm border border-gold/45 px-6 py-3 text-sm font-medium uppercase tracking-[0.07em] text-gold hover:bg-gold hover:text-black focus-visible:bg-gold focus-visible:text-black'
                        : cn('font-display text-4xl font-light leading-tight', active ? 'text-gold-lt' : 'text-ivory hover:text-gold-lt focus-visible:text-gold-lt'))}>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
