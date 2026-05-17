'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { JournalCategory } from '@/lib/journal';

interface JournalFiltersProps {
  categories: JournalCategory[];
  active: JournalCategory | 'All';
  onSelect: (cat: JournalCategory | 'All') => void;
}

/**
 * Category filter chips above the journal grid. Active chip slides smoothly
 * between options thanks to a shared layoutId on the gold pill background.
 *
 * Always includes "All" at the front so users can clear a filter.
 */
export function JournalFilters({ categories, active, onSelect }: JournalFiltersProps) {
  const options: (JournalCategory | 'All')[] = ['All', ...categories];

  return (
    <div className="mb-12 flex flex-wrap items-center justify-center gap-2 md:justify-start">
      {options.map((opt) => {
        const isActive = opt === active;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={cn(
              'relative rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] transition-colors',
              isActive
                ? 'border-transparent text-black'
                : 'border-border-sub text-silver hover:border-gold/40 hover:text-ivory',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="journal-filter-pill"
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-gold"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              />
            )}
            <span className="relative">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
