'use client';

import { usePathname } from 'next/navigation';
import { EmberCursor } from './EmberCursor';
import { ScrollProgress } from './ScrollProgress';
import { ScrollToTop } from './ScrollToTop';

/** True on the app surfaces, where the marketing effects must not load. */
export function isAppPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/dashboard') || pathname.startsWith('/r/');
}

/**
 * The marketing site's ambient effects (ember cursor, scroll progress bar, the
 * Lenis-aware scroll-to-top manager), mounted only outside the dashboard. A
 * schedule someone opens for twenty seconds on a phone needs none of them.
 */
export function MarketingFx() {
  const pathname = usePathname();
  if (isAppPath(pathname)) return null;
  return (
    <>
      <ScrollToTop />
      <ScrollProgress />
      <EmberCursor />
    </>
  );
}
