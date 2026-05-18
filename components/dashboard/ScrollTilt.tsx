'use client';

import { useScroll, useVelocity, useSpring, useTransform, motion } from 'motion/react';
import { useRef, type ReactNode } from 'react';

interface ScrollTiltProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps content in a div that subtly tilts and skews based on page scroll
 * velocity. As the user scrolls fast, cards lean into the motion; as scroll
 * settles, they spring back to flat.
 *
 * This is the 2D, performance-friendly hint at the Motion.dev "Heritage"
 * scroll velocity 3D plane effect. Same feel, no shaders.
 */
export function ScrollTilt({ children, className = '' }: ScrollTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, {
    stiffness: 150,
    damping: 22,
    mass: 0.6,
  });

  // Velocity is in px per second. A fast flick is ~3000+. Clamp the resulting
  // visual tilt so things stay tasteful, never silly.
  const rotateX = useTransform(smooth, [-3000, 0, 3000], [3, 0, -3]);
  const skewY = useTransform(smooth, [-3000, 0, 3000], [-1.2, 0, 1.2]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, skewY, transformPerspective: 1200 }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
