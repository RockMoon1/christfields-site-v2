'use client';

import { startTransition, useEffect, useState } from 'react';

/**
 * Returns true when the viewport is small or the primary pointer is coarse
 * (touch). Used throughout the dashboard to gate or downgrade expensive
 * animations and 3D rendering on phones.
 *
 * Server-render returns false so initial paint matches the desktop default,
 * then re-renders correctly after hydration via the resize listener.
 *
 * setIsMobile is wrapped in startTransition so React treats the update as
 * non-urgent. This is REQUIRED — without it, the state change can land
 * during a Suspense boundary's hydration (the PremiumOrb texture load is
 * one), triggering React error #300 ("This Suspense boundary received an
 * update before it finished hydrating"). startTransition lets the Suspense
 * finish first and applies the mobile flip on the next commit.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => {
      startTransition(() => {
        setIsMobile(mq.matches);
      });
    };
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  return isMobile;
}
