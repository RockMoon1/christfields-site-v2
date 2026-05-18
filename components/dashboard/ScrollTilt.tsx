'use client';

import {
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  motion,
} from 'motion/react';
import { type ReactNode } from 'react';

interface ScrollTiltProps {
  children: ReactNode;
  className?: string;
  /**
   * Card's position in the list. Drives a sine/cosine wave so adjacent cards
   * lean opposite directions when scrolling, creating a wave pattern across
   * the column rather than all cards moving in lockstep.
   */
  index?: number;
}

/**
 * Scroll-velocity wave wrapper. As the user scrolls fast, cards rotate, slide
 * horizontally, and rise/fall in a coordinated sine wave. At rest, everything
 * springs cleanly back to its neutral position so the page stays usable when
 * the user starts typing.
 *
 * This is the 2D, performance-friendly hint at the Motion.dev Heritage scroll
 * velocity 3D-plane effect. Same feel, no shaders, no R3F overhead.
 */
export function ScrollTilt({ children, className = '', index = 0 }: ScrollTiltProps) {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, {
    stiffness: 70,
    damping: 18,
    mass: 0.9,
  });

  // Phase the wave by card position. Sine for Y, cosine for X, so cards
  // describe a circular motion together — wave-like and never jarring.
  const phase = index * (Math.PI / 2.4);
  const ySin = Math.sin(phase);
  const xCos = Math.cos(phase);

  // Velocity is roughly px/sec. A normal scroll is 1000-2000, a fast flick
  // can hit 4000+. Tuned so amplitude is felt but never silly.
  const rotateX = useTransform(smooth, [-3500, 0, 3500], [10, 0, -10]);
  const y = useTransform(smooth, [-3500, 0, 3500], [-32 * ySin, 0, 32 * ySin]);
  const x = useTransform(smooth, [-3500, 0, 3500], [36 * xCos, 0, -36 * xCos]);
  const skewY = useTransform(smooth, [-3500, 0, 3500], [-2.2, 0, 2.2]);

  return (
    <motion.div
      style={{
        rotateX,
        x,
        y,
        skewY,
        transformPerspective: 1400,
      }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
