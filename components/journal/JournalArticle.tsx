'use client';

import { type ReactNode } from 'react';
import { PostReadingProgress, useArticleRef } from './PostReadingProgress';

interface JournalArticleProps {
  children: ReactNode;
}

/**
 * Wrapper for a single journal article body. Owns the article element ref
 * and mounts the per-article reading progress bar — the gold spring line at
 * the top of long posts that "Motion is not decoration" publicly promised.
 * The bar tracks scroll within the article itself, not the whole page, so
 * it fills based on how much of the post has actually been read.
 *
 * Prose and quotations render immediately as selectable text. This is the
 * article's only progress indicator; reading never waits on entrance motion.
 */
export function JournalArticle({ children }: JournalArticleProps) {
  const articleRef = useArticleRef();

  return (
    <>
      <PostReadingProgress targetRef={articleRef} />
      <article ref={articleRef} className="mx-auto max-w-[65ch] text-base md:text-lg">
        {children}
      </article>
    </>
  );
}
