'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Fixed thin gold line at the top of the viewport. Width tracks scroll
 * position. Lives in the root layout so it appears on every page.
 *
 * Sits at z-[101] so it stays above the sticky nav (z-100).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[101] h-[2px] bg-gradient-to-r from-gold via-gold-lt to-gold"
      aria-hidden
    />
  );
}
