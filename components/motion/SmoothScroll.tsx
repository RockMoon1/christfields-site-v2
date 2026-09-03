'use client';

import { ReactLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { isAppPath } from './MarketingFx';

/**
 * Smooth-scroll provider for the marketing site. Wraps the public pages in a
 * Lenis instance so every scroll and anchor jump feels weighted.
 *
 * The dashboard and the one-tap answer page pass straight through: native
 * momentum scrolling is what a utility app on a phone should have.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isAppPath(pathname)) return <>{children}</>;
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      }}
    >
      {children}
    </ReactLenis>
  );
}
