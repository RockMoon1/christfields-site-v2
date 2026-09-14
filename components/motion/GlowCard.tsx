'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import { useRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Color of the glow (CSS color string). Defaults to gold. */
  glowColor?: string;
  /** Radius of the glow in px. */
  glowSize?: number;
  /** Inline styles for the card root (e.g. a tinted surface gradient). */
  style?: CSSProperties;
}

/**
 * A card wrapper that renders a radial glow following the cursor on hover.
 * The glow sits behind the content via mix-blend-mode: plus-lighter for
 * that premium warm ember feel without washing out text.
 */
export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(201, 165, 72, 0.15)',
  glowSize = 200,
  style,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(${glowSize}px circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`;
  const [active, setActive] = useState(false);

  function handleMove(e: MouseEvent) {
    if (!ref.current || reduceMotion) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => !reduceMotion && setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* Glow layer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-200 motion-reduce:transition-none"
        style={{
          opacity: active && !reduceMotion ? 1 : 0,
          background,
          mixBlendMode: 'plus-lighter',
        }}
      />
      {/* Content */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
