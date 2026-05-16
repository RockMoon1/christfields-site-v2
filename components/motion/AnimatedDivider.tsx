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
 * The scaleX animation runs once when the divider first scrolls into view.
 * `prefers-reduced-motion` users see it pre-drawn at full width.
 */
export function AnimatedDivider({ className = '' }: AnimatedDividerProps) {
  return (
    <div className={`relative w-full ${className}`} aria-hidden>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'left center' }}
        className="h-px w-full bg-gradient-to-r from-transparent via-border-gold to-transparent"
      />
    </div>
  );
}
