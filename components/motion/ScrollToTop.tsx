'use client';

import { useLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Put the window at an offset, the one way that survives Lenis.
 *
 * Lenis owns scrolling in root mode (see SmoothScroll) and swallows every
 * gentler option: its own scrollTo measured as a no-op here, native
 * `behavior: 'smooth'` never leaves the starting offset, and a hand-rolled
 * per-frame tween gets overwritten by Lenis's own loop. A single instant
 * write lands and stays, so jumps are immediate rather than animated.
 */
function placeAt(top: number) {
  window.scrollTo({ top, left: 0, behavior: 'instant' });
}

/**
 * Bring a fragment target into view and keep it there while the page settles.
 *
 * One placement is not enough: a section below the fold may not be mounted on
 * the first frame, and its offset keeps moving as fonts, images and entrance
 * animations resolve — measured landing ~2,400px short of the mark with a
 * single attempt. So the target is re-placed across the first second, and any
 * real scroll input abandons the rest so the page never fights the reader.
 *
 * Returns a cleanup function.
 */
function settleOnHash(hash: string, sync?: (top: number) => void) {
  const id = decodeURIComponent(hash.slice(1));
  let cancelled = false;
  const timers: number[] = [];

  const place = () => {
    if (cancelled) return;
    const target = document.getElementById(id);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY;
    placeAt(top);
    sync?.(top);
  };

  const abandon = () => {
    cancelled = true;
  };

  for (const delay of [0, 60, 160, 400, 800]) {
    timers.push(window.setTimeout(place, delay));
  }

  window.addEventListener('wheel', abandon, { passive: true, once: true });
  window.addEventListener('touchstart', abandon, { passive: true, once: true });
  window.addEventListener('keydown', abandon, { once: true });

  return () => {
    cancelled = true;
    timers.forEach((timer) => window.clearTimeout(timer));
    window.removeEventListener('wheel', abandon);
    window.removeEventListener('touchstart', abandon);
    window.removeEventListener('keydown', abandon);
  };
}

/**
 * Owns where the page sits after any navigation.
 *
 * The rule, applied to first loads, link clicks, Back and Forward alike: a URL
 * carrying a fragment lands on that fragment, and everything else lands at the
 * top. Both halves needed hand-holding, because two defaults work against us:
 *
 * 1. Browsers restore the previous scroll offset on Back/Forward
 *    (history.scrollRestoration defaults to 'auto'), which dropped you into
 *    the middle of the homepage on the way back from a product page instead
 *    of its top. 'manual' hands that decision to us.
 *
 * 2. globals.css sets scroll-behavior: smooth, so an ordinary scrollTo would
 *    turn every navigation into a long animated flight up the page.
 *    placeAt's instant write keeps the jump silent.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const lenis = useLenis();
  const lenisRef = useRef(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  /**
   * Same-page anchor clicks (#groups, #vision, the keyboard skip link).
   *
   * These are Next <Link>s, so Next intercepts the click, swaps the URL and
   * then tries to scroll — and Lenis writes its own unchanged offset back a
   * frame later, leaving the reader where they were. Lenis's `anchors` option
   * loses the same race, so the click is taken in the capture phase and the
   * move done here instead.
   */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as
        | HTMLAnchorElement
        | null;
      if (!anchor || anchor.target === '_blank') return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Cross-page fragments are a real navigation; the effect below lands them.
      if (url.pathname !== window.location.pathname) return;

      const id = decodeURIComponent(url.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY;
      placeAt(top);
      lenisRef.current?.scrollTo(top, { immediate: true, force: true });
      window.history.pushState(null, '', url.hash);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    const { hash } = window.location;

    if (hash) {
      return settleOnHash(hash, (top) =>
        lenisRef.current?.scrollTo(top, { immediate: true, force: true }),
      );
    }

    placeAt(0);
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
