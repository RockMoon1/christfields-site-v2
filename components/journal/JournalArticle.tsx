'use client';

import { motion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { PostReadingProgress } from './PostReadingProgress';

interface JournalArticleProps {
  children: ReactNode;
}

/**
 * Animated wrapper for a single journal article. Provides the article ref
 * the per-post reading progress bar tracks, and a soft enter animation when
 * the post first paints.
 */
export function JournalArticle({ children }: JournalArticleProps) {
  const ref = useRef<HTMLElement>(null);

  return (
    <>
      <PostReadingProgress targetRef={ref} />
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="mx-auto max-w-2xl"
      >
        {children}
      </motion.article>
    </>
  );
}
