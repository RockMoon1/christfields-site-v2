'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

interface MorphBlobProps {
  /** CSS color for the blob. */
  color?: string;
  /** Size in px (width & height). */
  size?: number;
  /** Extra className for positioning. */
  className?: string;
}

/**
 * A subtly morphing gradient blob that floats and warps continuously.
 * Place with absolute positioning between sections for ambient depth.
 * Uses CSS filter blur so it stays performant (composited layer).
 */
export function MorphBlob({
  color = 'rgba(201, 165, 72, 0.06)',
  size = 500,
  className = '',
}: MorphBlobProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { margin: '100px' });
  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(60px)',
      }}
      // Animate only while visible. The radial material is static under reduce.
      animate={reduceMotion || !inView ? { scale: 1, x: 0, y: 0 } : {
        scale: [1, 1.15, 0.95, 1.08, 1],
        x: [0, 30, -20, 15, 0],
        y: [0, -25, 15, -10, 0],
      }}
      transition={reduceMotion || !inView ? { duration: 0 } : {
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
