'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { JournalCard } from './JournalCard';
import { JournalFilters } from './JournalFilters';
import type { JournalCategory, JournalPost } from '@/lib/journal';

interface JournalGridProps {
  posts: JournalPost[];
  categories: JournalCategory[];
}

/**
 * Client-side grid of journal posts with category filtering.
 *
 * The newest post takes a featured 2x2 slot. Remaining posts fill the bento
 * grid. Filtering animates via AnimatePresence so cards fade out / in
 * smoothly when the active category changes.
 */
export function JournalGrid({ posts, categories }: JournalGridProps) {
  const [active, setActive] = useState<JournalCategory | 'All'>('All');

  const filtered = active === 'All' ? posts : posts.filter((p) => p.frontmatter.category === active);

  return (
    <>
      <JournalFilters categories={categories} active={active} onSelect={setActive} />

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-silver">
          No posts in this category yet. Check back soon.
        </p>
      ) : (
        <motion.div
          layout
          className="grid auto-rows-fr gap-6 sm:grid-cols-2 md:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((post, i) => (
              <motion.div
                key={post.slug}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={i === 0 && active === 'All' ? 'sm:col-span-2 md:col-span-2 md:row-span-2' : ''}
              >
                <JournalCard
                  post={post}
                  featured={i === 0 && active === 'All'}
                  index={i}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
