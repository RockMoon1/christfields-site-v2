'use client';

import { type ReactNode, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

interface MagneticButtonProps {
  children: ReactNode;
  /** How far the wrapped element drifts toward the cursor as a fraction of its center offset. */
  strength?: number;
  className?: string;
}

/**
 * Wraps any inline element with a magnetic hover effect. The wrapped content
 * drifts gently toward the cursor when hovered and springs back when the
 * cursor leaves.
 *
 * Skips the effect on touch devices and when the user prefers reduced motion.
 */
export function MagneticButton({ children, strength = 0.25, className = '' }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 15, mass: 0.4 });

  if (reduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: 'inline-block', willChange: 'transform' }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set((e.clientX - cx) * strength);
        y.set((e.clientY - cy) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
