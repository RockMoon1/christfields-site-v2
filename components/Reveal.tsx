'use client';

import { motion, type Variants } from 'motion/react';
import { type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before animation begins. Useful for staggering siblings. */
  delay?: number;
  /** Distance in pixels to translate up from. Default 18. */
  y?: number;
  /** Optional scale entrance. Default 1 means no scale shift. */
  scale?: number;
  /** Whether to animate only once. Default true. */
  once?: boolean;
  /** Extra className for the wrapper div */
  className?: string;
  /** Render as a specific element type. Default div. */
  as?: 'div' | 'section' | 'article' | 'li' | 'span';
  /**
   * Entrance grammar:
   * - 'fade': soft rise + fade for body copy (default).
   * - 'clip': clip-path inset settle for cards and media — feels like the
   *   element is being unveiled rather than materializing from fog.
   */
  variant?: 'fade' | 'clip';
}

/**
 * Scroll-into-view reveal wrapper.
 *
 * Retuned: prose gets a quick, light rise (no heavy blur — uniform blur on
 * every element was reading as fog and made the whole page enter the same
 * way). Cards get a clip-path unveil. Display headings should use
 * TextSplit / SectionHeader instead, so the page has three distinct
 * entrance grammars rather than one.
 *
 * Honors prefers-reduced-motion automatically through Motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  scale = 1,
  once = true,
  className = '',
  as = 'div',
  variant = 'fade',
}: RevealProps) {
  const variants: Variants =
    variant === 'clip'
      ? {
          hidden: {
            opacity: 0,
            clipPath: 'inset(8% 6% 8% 6% round 8px)',
            scale: 0.985,
          },
          visible: {
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            scale: 1,
            transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1], delay },
          },
        }
      : {
          hidden: { opacity: 0, y, scale },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
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
