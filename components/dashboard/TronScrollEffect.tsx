'use client';

import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
} from 'motion/react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

/**
 * TRON-style scroll trails. As the user scrolls, glowing gold lines pulse
 * at the top and bottom edges of the viewport and a faint horizontal scan
 * beam streaks across the middle. Everything fades back to invisible the
 * moment scroll velocity returns to zero, so the page feels alive when
 * the user is moving and still when they are reading.
 *
 * All elements are fixed-position and pointer-events-none so they never
 * interfere with clicks or text selection.
 */
export function TronScrollEffect() {
  const isMobile = useIsMobile();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, {
    stiffness: 200,
    damping: 30,
    mass: 0.4,
  });

  // Skip the whole effect on mobile. The spring driven transforms on three
  // separate elements each frame plus the mid-screen blur halo are too
  // expensive on small GPUs, and the visual payoff is much weaker on a
  // small screen where the edges are millimeters apart.
  if (isMobile) return null;

  // Absolute velocity → opacity. Even tiny scroll triggers a hint of glow;
  // a fast flick lights the edges up dramatically.
  const edgeOpacity = useTransform(smooth, (v) => {
    const abs = Math.min(Math.abs(v), 3000);
    return Math.min(0.85, abs / 1500);
  });

  // A wider, softer halo on the same pulse — gives the line some "thickness"
  // through pure blur instead of physical height.
  const haloOpacity = useTransform(smooth, (v) => {
    const abs = Math.min(Math.abs(v), 3000);
    return Math.min(0.45, abs / 2500);
  });

  // Horizontal scan beam: a thin gold line that drifts left/right based on
  // scroll direction. Up-scroll pulls it right, down-scroll pulls it left,
  // amplifying the feeling of momentum.
  const beamX = useTransform(smooth, [-2500, 0, 2500], ['-30%', '0%', '30%']);
  const beamOpacity = useTransform(smooth, (v) => {
    const abs = Math.min(Math.abs(v), 2500);
    return Math.min(0.7, abs / 2000);
  });

  return (
    <>
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
    </>
  );
}
