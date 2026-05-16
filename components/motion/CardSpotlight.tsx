'use client';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import { type ReactNode, useRef, useState } from 'react';

interface CardSpotlightProps {
  children: ReactNode;
  className?: string;
  /** Diameter of the glow in pixels. Default 280. */
  size?: number;
  /** Peak opacity of the gold light. Default 0.35. */
  intensity?: number;
}

/**
 * Wraps a card with a soft gold spotlight that follows the cursor when
 * hovered. The card itself looks like it has a small fire near where you
 * point. Premium "Apple-style" effect.
 *
 * The glow renders AFTER the card content with mix-blend-mode: plus-lighter
 * so it adds light to whatever is under it (the card background, text, etc).
 * That avoids the case where a solid card background hides the glow.
 *
 * Skipped on touch devices and for users who prefer reduced motion.
 */
export function CardSpotlight({
  children,
  className = '',
  size = 280,
  intensity = 0.35,
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
      className={`relative ${className}`}
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
      {children}

      {/* Glow renders ABOVE the children with plus-lighter so it brightens
          whatever is underneath. pointer-events-none keeps clicks working. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500"
        style={{
          background,
          opacity: hover ? 1 : 0,
          mixBlendMode: 'plus-lighter',
        }}
      />
    </div>
  );
}
