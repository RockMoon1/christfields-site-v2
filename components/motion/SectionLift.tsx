'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Lifts a whole section in as it scrolls into view: a gentle rise + fade so each
 * section "arrives" rather than just appearing. Subtle on purpose, so it layers
 * cleanly over the inner Reveal animations. Honors reduced-motion via Motion.
 *
 * Do NOT wrap sections that run their own useScroll measurements (the marquee,
 * the journey): a transformed parent can skew their scroll math.
 */
export function SectionLift({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  /** Optional anchor id, so the section rail can scroll here. */
  id?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      data-motion-reveal
      id={id}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 36 }}
      animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -90px 0px' }}
      transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
