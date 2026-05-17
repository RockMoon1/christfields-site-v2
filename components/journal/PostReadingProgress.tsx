'use client';

import { motion, useScroll, useSpring } from 'motion/react';
import { useRef, type RefObject } from 'react';

interface PostReadingProgressProps {
  /** Ref to the article element whose scroll progress is tracked. */
  targetRef: RefObject<HTMLElement | null>;
}

/**
 * Per-article reading progress bar. Sits at the top of the viewport just
 * below the site nav. Tracks the user's scroll position WITHIN the article
 * element (rather than the whole page), so the bar fills based on how much
 * of the post they have actually read.
 */
export function PostReadingProgress({ targetRef }: PostReadingProgressProps) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="pointer-events-none fixed left-0 right-0 top-[var(--nav-h)] z-[102] h-[2px] bg-gradient-to-r from-gold via-gold-lt to-gold"
    />
  );
}

/**
 * Convenience hook to create the article ref a page passes into the progress bar.
 * Avoids importing useRef in pages that just need to wire one up.
 */
export function useArticleRef() {
  return useRef<HTMLElement>(null);
}
