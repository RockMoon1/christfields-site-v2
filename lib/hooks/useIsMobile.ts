'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the viewport is small or the primary pointer is coarse
 * (touch). Used throughout the dashboard to gate or downgrade expensive
 * animations and 3D rendering on phones, since touch devices do not hover
 * and small GPUs can not keep up with full-DPI WebGL.
 *
 * Server-render returns false so initial paint matches the desktop default,
 * then re-renders correctly after hydration via the resize listener.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  return isMobile;
}
