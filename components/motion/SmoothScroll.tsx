'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import { ReactLenis, type LenisRef } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { useCallback, type ReactNode } from 'react';
import { isAppPath } from './MarketingFx';

/**
 * Smooth-scroll instance for the marketing site. Lenis root mode exposes its
 * instance through the package's root store, without wrapping page content.
 *
 * The dashboard and the one-tap answer page pass straight through: native
 * momentum scrolling is what a utility app on a phone should have.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const stopBeforeDetach = useCallback((handle: LenisRef | null) => {
    const instance = handle?.lenis;
    // Lenis 1.3.23 destroy() leaves its native-scroll reset timer pending.
    // Public stop() resets scrolling state first, making the late timer a no-op.
    // React 19's ref cleanup runs before the wrapper's passive destroy effect.
    return () => instance?.stop();
  }, []);
  return (
    <>
      {/* Keep the page mounted when the preference changes, preserving drafts. */}
      {!isAppPath(pathname) && !reduceMotion && (
        <ReactLenis
          ref={stopBeforeDetach}
          root
          options={{
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            wheelMultiplier: 1,
            touchMultiplier: 1.5,
          }}
        />
      )}
      {children}
    </>
  );
}
