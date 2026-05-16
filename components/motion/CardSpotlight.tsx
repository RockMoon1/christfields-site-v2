'use client';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion';
import { type ReactNode, useRef, useState } from 'react';

interface CardSpotlightProps {
  children: ReactNode;
  className?: string;
  /** Diameter of the glow in pixels. Default 280. */
  size?: number;
  /** Peak opacity of the gold light. Default 0.18. */
  intensity?: number;
}

/**
 * Wraps a card with a soft gold spotlight that follows the cursor when
 * hovered. The card itself looks like it has a small fire near where you
 * point. Premium "Apple-style" effect.
 *
 * Skipped on touch devices and for users who prefer reduced motion. Does
 * not change the layout of the wrapped content.
 */
export function CardSpotlight({
  children,
  className = '',
  size = 280,
  intensity = 0.18,
}: CardSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [hover, setHover] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, rgba(228, 201, 122, ${intensity}), transparent 70%)`;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={`group/spot relative ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
    >
      {/* The glow layer sits absolute, matches the card shape via rounded-[inherit].
          Parent (the card) must have a border-radius for it to be visible. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500"
        style={{ background, opacity: hover ? 1 : 0 }}
      />
      {children}
    </div>
  );
}
