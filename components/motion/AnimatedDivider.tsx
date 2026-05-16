'use client';

import { motion } from 'framer-motion';

interface AnimatedDividerProps {
  /** Optional extra className for spacing or width tweaks. */
  className?: string;
}

/**
 * Horizontal gold-gradient hairline that draws itself left-to-right when
 * it enters the viewport. Used between sections instead of plain CSS
 * borders so transitions feel deliberate.
 *
 * The line is intentionally a bit brighter than the v1 section borders so
 * the drawing animation is clearly visible. A soft gold drop-shadow gives
 * it a warm glow without making it loud.
 */
export function AnimatedDivider({ className = '' }: AnimatedDividerProps) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`} aria-hidden>
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: '0px 0px -8% 0px' }}
        transition={{
          scaleX: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.6, ease: 'easeOut' },
        }}
        style={{
          transformOrigin: 'left center',
          boxShadow: '0 0 12px rgba(201, 165, 72, 0.35)',
        }}
        className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />
    </div>
  );
}
