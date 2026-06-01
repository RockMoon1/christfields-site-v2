'use client';

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
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -90px 0px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
