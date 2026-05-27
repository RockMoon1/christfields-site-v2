'use client';

import { useEffect, useState } from 'react';

/**
 * True only on a "capable computer": a large viewport, a real (fine) pointer
 * that can hover, motion allowed, and enough hardware to handle heavier
 * effects. Used to gate desktop-only flourishes (cursor parallax, tilt,
 * scroll reveals) so phones and low-powered machines stay light and fast.
 *
 * SSR-safe: returns false until mounted, then evaluates and keeps itself in
 * sync as the viewport, pointer, or motion preference changes.
 */
export function useDesktopFx(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const queries = [
      window.matchMedia('(min-width: 1024px)'),
      window.matchMedia('(pointer: fine)'),
      window.matchMedia('(hover: hover)'),
      window.matchMedia('(prefers-reduced-motion: no-preference)'),
    ];

    // Hardware floor. deviceMemory is missing in Safari/Firefox, so we default
    // it to a passing value rather than excluding those browsers.
    const nav = window.navigator as Navigator & { deviceMemory?: number };
    const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4;
    const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 4;
    const capableHardware = cores >= 4 && memory >= 4;

    const evaluate = () => setEnabled(queries.every((q) => q.matches) && capableHardware);

    evaluate();
    queries.forEach((q) => q.addEventListener('change', evaluate));
    return () => queries.forEach((q) => q.removeEventListener('change', evaluate));
  }, []);

  return enabled;
}
