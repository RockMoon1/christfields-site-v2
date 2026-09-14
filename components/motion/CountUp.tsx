'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

interface CountUpProps {
  /** The target number to count up to. */
  to: number;
  /** Duration of the count animation in ms. */
  duration?: number;
  /** Optional prefix (e.g. "$"). */
  prefix?: string;
  /** Optional suffix (e.g. "+", "%"). */
  suffix?: string;
  /** className for the number span. */
  className?: string;
}

/**
 * Scroll-triggered count-up animation. Counts from 0 to `to` when the
 * element enters the viewport. Uses requestAnimationFrame for smooth
 * interpolation.
 */
export function CountUp({
  to,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
}: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || reduceMotion) return;

    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * to));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, to, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{prefix}{to}{suffix}</span>
      {/* The final value is readable before hydration under reduced motion. */}
      <span aria-hidden className="motion-reduce:hidden">{prefix}{count}{suffix}</span>
      <span aria-hidden className="hidden motion-reduce:inline">{prefix}{to}{suffix}</span>
    </span>
  );
}
