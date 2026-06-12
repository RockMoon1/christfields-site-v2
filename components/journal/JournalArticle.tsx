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
 * Entrance motion now lives at the block level (ProseBlock / ScriptureQuote
 * in mdxComponents), so the wrapper itself stays still: the prose breathes
 * paragraph by paragraph instead of fading in as one slab.
 */
export function JournalArticle({ children }: JournalArticleProps) {
  const articleRef = useArticleRef();

  return (
    <>
      <PostReadingProgress targetRef={articleRef} />
      <article ref={articleRef} className="mx-auto max-w-2xl">
        {children}
      </article>
    </>
  );
}
