'use client';

import { ReactLenis } from 'lenis/react';
import { type ReactNode } from 'react';

/**
 * Smooth-scroll provider. Wraps the entire app in a Lenis instance so every
 * scroll, anchor jump, and motion-driven animation feels weighted instead of
 * jumpy. This is the single biggest "this site feels expensive" upgrade.
 *
 * Settings tuned for a calm, deliberate feel that fits the brand. Faster
 * sites use shorter durations; we want this one to feel reverent.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
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
