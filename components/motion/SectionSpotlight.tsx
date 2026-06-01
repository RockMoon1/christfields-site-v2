'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

/**
 * A cursor-following radial glow scoped to its nearest positioned ancestor.
 * Drop it as the first child of a `relative overflow-hidden` section and a soft
 * spotlight will track the cursor across it. Hidden on touch devices (no hover),
 * pointer-events-none so it never blocks clicks.
 */
export function SectionSpotlight({
  color = 'rgba(201, 165, 72, 0.10)',
  size = 460,
}: {
  color?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 140, damping: 26, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 140, damping: 26, mass: 0.6 });
  const opacity = useMotionValue(0);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent || typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) return; // touch: skip

    const onMove = (e: MouseEvent) => {
      const r = parent.getBoundingClientRect();
      x.set(e.clientX - r.left);
      y.set(e.clientY - r.top);
      opacity.set(1);
    };
    const onLeave = () => opacity.set(0);

    parent.addEventListener('mousemove', onMove);
    parent.addEventListener('mouseleave', onLeave);
    return () => {
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, [x, y, opacity]);

  return (
    <motion.div ref={ref} aria-hidden style={{ opacity }} className="pointer-events-none absolute inset-0 -z-0">
      <motion.div
        className="absolute rounded-full"
        style={{
          left: sx,
          top: sy,
          width: size,
          height: size,
          x: '-50%',
          y: '-50%',
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          mixBlendMode: 'plus-lighter',
        }}
      />
    </motion.div>
  );
}
