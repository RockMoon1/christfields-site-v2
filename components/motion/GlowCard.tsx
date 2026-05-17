'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Color of the glow (CSS color string). Defaults to gold. */
  glowColor?: string;
  /** Radius of the glow in px. */
  glowSize?: number;
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
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  function handleMove(e: MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Glow layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(${glowSize}px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 70%)`,
          mixBlendMode: 'plus-lighter',
        }}
      />
      {/* Content */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
