'use client';

import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
} from 'motion/react';

/**
 * TRON-style scroll trails. Edge glows pulse with scroll velocity and a
 * midline beam drifts horizontally based on scroll direction. Everything
 * fades back to invisible the moment scroll stops.
 *
 * Wrapped in a div with hidden md:block — we skip the entire effect on
 * mobile via CSS rather than JS, so this component never reads viewport
 * state and never causes re-renders that disturb Suspense boundaries.
 */
export function TronScrollEffect() {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, {
    stiffness: 200,
    damping: 30,
    mass: 0.4,
  });

  const edgeOpacity = useTransform(smooth, (v) => {
    const abs = Math.min(Math.abs(v), 3000);
    return Math.min(0.85, abs / 1500);
  });

  const haloOpacity = useTransform(smooth, (v) => {
    const abs = Math.min(Math.abs(v), 3000);
    return Math.min(0.45, abs / 2500);
  });

  const beamX = useTransform(smooth, [-2500, 0, 2500], ['-30%', '0%', '30%']);
  const beamOpacity = useTransform(smooth, (v) => {
    const abs = Math.min(Math.abs(v), 2500);
    return Math.min(0.7, abs / 2000);
  });

  return (
    <div className="hidden md:contents">
      {/* Top edge glow */}
      <motion.div
        aria-hidden
        style={{ opacity: edgeOpacity }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px bg-gradient-to-r from-transparent via-gold to-transparent"
      />
      <motion.div
        aria-hidden
        style={{ opacity: haloOpacity }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[59] h-6 bg-gradient-to-b from-gold/40 to-transparent blur-sm"
      />

      {/* Bottom edge glow */}
      <motion.div
        aria-hidden
        style={{ opacity: edgeOpacity }}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-px bg-gradient-to-r from-transparent via-gold to-transparent"
      />
      <motion.div
        aria-hidden
        style={{ opacity: haloOpacity }}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[59] h-6 bg-gradient-to-t from-gold/40 to-transparent blur-sm"
      />

      {/* Drifting horizontal scan beam at mid-viewport */}
      <motion.div
        aria-hidden
        style={{ opacity: beamOpacity, x: beamX }}
        className="pointer-events-none fixed left-0 top-1/2 z-[58] h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-gold-lt to-transparent"
      />
    </div>
  );
}
