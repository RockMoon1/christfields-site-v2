'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { type MouseEvent } from 'react';
import { CountUp } from '@/components/motion/CountUp';

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  /** Accent color used for the corner dot, top line, and cursor glow. */
  accent?: string;
  /** Position in the row, drives stagger entrance + pulse offsets. */
  index?: number;
}

/**
 * A stat card with motion baked in:
 *  - stagger entrance fade-up
 *  - hover lift + scale via spring
 *  - cursor-following accent glow (hidden under md via CSS)
 *  - continuously pulsing corner dot and top accent line
 *  - CountUp animation on the number itself
 *
 * No useIsMobile here — gating is pure CSS. See HeroPanel for the rationale.
 */
export function StatCard({
  label,
  value,
  hint,
  accent = '#c9a548',
  index = 0,
}: StatCardProps) {
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const springX = useSpring(mouseX, { stiffness: 220, damping: 26 });
  const springY = useSpring(mouseY, { stiffness: 220, damping: 26 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.012 }}
      transition={{
        opacity: { duration: 0.55, delay: 0.18 + index * 0.08, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.55, delay: 0.18 + index * 0.08, ease: [0.22, 1, 0.36, 1] },
        scale: { type: 'spring', stiffness: 280, damping: 22 },
      }}
      className="group relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6"
    >
      {/* Cursor-tracking accent glow. Hidden under md so touch devices skip
          the radial gradient draw entirely. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute hidden h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
        style={{
          left: springX,
          top: springY,
          background: `radial-gradient(circle, ${accent}38, transparent 65%)`,
          mixBlendMode: 'plus-lighter',
        }}
      />

      {/* Top accent line that breathes */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
        animate={{ opacity: [0.35, 0.85, 0.35] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.5,
        }}
      />

      {/* Pulsing corner dot in the area's accent color */}
      <motion.span
        aria-hidden
        className="absolute right-4 top-4 inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: accent }}
        animate={{
          opacity: [0.45, 1, 0.45],
          boxShadow: [
            `0 0 0px ${accent}`,
            `0 0 10px ${accent}`,
            `0 0 0px ${accent}`,
          ],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.35,
        }}
      />

      <p className="relative mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <p className="relative font-display text-4xl font-light text-gold-lt md:text-5xl">
        <CountUp to={value} duration={1600} />
      </p>
      <p className="relative mt-3 text-xs text-silver">{hint}</p>
    </motion.div>
  );
}
