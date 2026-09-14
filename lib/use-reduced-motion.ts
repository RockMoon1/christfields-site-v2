'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const preference = window.matchMedia(QUERY);
  preference.addEventListener('change', onChange);
  return () => preference.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * Motion 12's hook reads the initial preference once. Subscribe directly so
 * changing the system setting also removes Lenis and stops decorative work.
 * The false server snapshot preserves hydration; reduced-motion CSS keeps
 * server-rendered entrances visible before this subscription takes over.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
