'use client';

import { motion } from 'motion/react';
import { useRef, type ReactNode } from 'react';

interface JournalArticleProps {
  children: ReactNode;
}

/**
 * Animated wrapper for a single journal article. The global ScrollProgress
 * bar (in app/layout.tsx) already shows reading progress, so we deliberately
 * do NOT render a second per-article bar here. One gold line at the top.
 */
export function JournalArticle({ children }: JournalArticleProps) {
  const ref = useRef<HTMLElement>(null);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="mx-auto max-w-2xl"
    >
      {children}
    </motion.article>
  );
}
