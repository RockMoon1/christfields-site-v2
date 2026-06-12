'use client';

import { useMotionValue, useReducedMotion, type MotionValue } from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PinnedScrubProps {
  /**
   * Render prop receiving the section's scroll progress (0 at pin start,
   * 1 at release). Drive any number of transforms off it with useTransform
   * inside the child component.
   */
  children: (progress: MotionValue<number>) => ReactNode;
  /**
   * How many viewport-heights of scroll the pinned stage holds. 3 means the
   * reader scrolls three screens while the stage stays put. Default 3.
   */
  lengthVh?: number;
  /** Classes for the sticky inner stage. */
  stageClassName?: string;
  /** Classes for the tall outer track. */
  className?: string;
  /** Optional anchor id. */
  id?: string;
}

/**
 * The pinned scroll-scrub primitive: an outer tall track with an inner
 * position:sticky stage. While the reader scrolls through the track, the
 * stage holds the viewport and `progress` scrubs 0 → 1.
 *
 * Progress is measured directly from the track's live bounding rect on each
 * scroll frame instead of Motion's useScroll. useScroll caches the target's
 * offsets at mount and only re-measures on resize, so anything that shifts
 * layout afterward (font swap, the desktop/touch mode swap above this
 * section, HMR) left progress topping out early — the reader hit the end of
 * the pin while the scrub still thought it was mid-way. A rect read per
 * scroll event is cheap and always true.
 *
 * Rules:
 * - Never wrap a PinnedScrub in a transformed ancestor (e.g. SectionLift);
 *   transforms break position:sticky for real.
 * - Under reduced motion the track collapses to a single viewport and
 *   progress jumps straight to 1, so content rests in its settled state.
 */
export function PinnedScrub({
  children,
  lengthVh = 3,
  stageClassName = '',
  className = '',
  id,
}: PinnedScrubProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (reduceMotion) {
      progress.set(1);
      return;
    }

    let ticking = false;
    const measure = () => {
      ticking = false;
      const rect = track.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      if (span <= 0) {
        progress.set(1);
        return;
      }
      progress.set(Math.min(1, Math.max(0, -rect.top / span)));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Fonts settling can shift everything above the track; re-measure once.
    if (document.fonts?.ready) document.fonts.ready.then(onScroll).catch(() => {});
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [progress, reduceMotion]);

  const height = reduceMotion ? '100vh' : `${Math.max(1, lengthVh) * 100}vh`;

  return (
    <div ref={trackRef} id={id} className={cn('relative', className)} style={{ height }}>
      <div
        className={cn(
          'sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden',
          stageClassName,
        )}
      >
        {children(progress)}
      </div>
    </div>
  );
}
