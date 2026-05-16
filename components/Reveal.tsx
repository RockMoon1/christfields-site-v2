'use client';

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before animation begins. Useful for staggering siblings. */
  delay?: number;
  /** Distance in pixels to translate up from. Default 20. */
  y?: number;
  /** Whether to animate only once. Default true. */
  once?: boolean;
  /** Extra className for the wrapper div */
  className?: string;
  /** Render as a specific element type. Default div. */
  as?: 'div' | 'section' | 'article' | 'li' | 'span';
}

/**
 * Scroll-into-view reveal wrapper. Wraps content in a motion element
 * that fades and slides up when it enters the viewport.
 *
 * Honors prefers-reduced-motion automatically via Framer Motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  once = true,
  className = '',
  as = 'div',
}: RevealProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay,
      },
    },
  };

  const MotionEl = motion[as];

  return (
    <MotionEl
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '0px 0px -40px 0px' }}
      variants={variants}
      className={className}
    >
      {children}
    </MotionEl>
  );
}
