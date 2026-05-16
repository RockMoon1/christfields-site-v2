'use client';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface HeroSpotlightProps {
  /** Diameter of the spotlight in pixels. Default 520. */
  size?: number;
  /** Peak opacity of the gold light. Default 0.12. */
  intensity?: number;
}

/**
 * Soft warm spotlight that follows the cursor inside the hero. Reinforces
 * the warmth-and-fire identity without being obvious.
 *
 * Drop this as a child of any positioned hero element (the hero already uses
 * relative positioning). Pointer-events are disabled so it never blocks
 * underlying content.
 */
export function HeroSpotlight({ size = 520, intensity = 0.12 }: HeroSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 70, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 70, damping: 22, mass: 0.6 });

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${sx}px ${sy}px, rgba(228, 201, 122, ${intensity}), transparent 65%)`;

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
      return;
    }

    const el = ref.current?.parentElement;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    const onLeave = () => {
      x.set(-9999);
      y.set(-9999);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [reduceMotion, x, y]);

  if (reduceMotion) return null;

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0"
      style={{ background }}
    />
  );
}
