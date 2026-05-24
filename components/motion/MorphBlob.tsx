'use client';

import { motion } from 'motion/react';

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
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(60px)',
      }}
      // Only transform props (scale/x/y) animate — they run on the compositor.
      // The borderRadius morph was dropped: it forces a paint every frame and is
      // invisible under the 60px blur anyway.
      animate={{
        scale: [1, 1.15, 0.95, 1.08, 1],
        x: [0, 30, -20, 15, 0],
        y: [0, -25, 15, -10, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
