'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { toggleToday, type RhythmWithStatus } from '@/app/dashboard/(app)/rhythms/actions';

/**
 * Compact, one-tap view of today's daily rhythms for the Overview page.
 * Tapping a row checks or unchecks it for today, optimistically. There is
 * no shame for an unchecked row. It is simply not done yet.
 */
export function TodayRhythms({ initial }: { initial: RhythmWithStatus[] }) {
  const [rhythms, setRhythms] = useState<RhythmWithStatus[]>(initial);
  const [, startTransition] = useTransition();

  function toggle(id: string) {
    setRhythms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, doneToday: !r.doneToday } : r)),
    );
    startTransition(async () => {
      try {
        await toggleToday(id);
      } catch {
        // Roll back on failure.
        setRhythms((prev) =>
          prev.map((r) => (r.id === id ? { ...r, doneToday: !r.doneToday } : r)),
        );
      }
    });
  }

  if (rhythms.length === 0) {
    return (
      <div className="flex h-full flex-col justify-center rounded-sm border border-border-sub bg-black-3 p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Today</p>
        <p className="mt-3 text-sm leading-relaxed text-silver">
          Your daily rhythms will live here. A few small practices to return to.
        </p>
        <Link
          href="/dashboard/rhythms"
          prefetch
          className="mt-4 inline-block text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
        >
          Set up your rhythms &rarr;
        </Link>
      </div>
    );
  }

  const done = rhythms.filter((r) => r.doneToday).length;

  return (
    <div className="flex h-full flex-col rounded-sm border border-border-sub bg-black-3 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Today</p>
        <p className="text-xs text-silver">
          {done} of {rhythms.length} kept
        </p>
      </div>

      <ul className="flex-1 space-y-2">
        {rhythms.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => toggle(r.id)}
              aria-pressed={r.doneToday}
              className={cn(
                'flex w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors',
                r.doneToday
                  ? 'border-border-gold bg-black-2'
                  : 'border-border-sub hover:border-border-gold',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                  r.doneToday ? 'border-transparent' : 'border-border-sub',
                )}
                style={r.doneToday ? { backgroundColor: r.color } : undefined}
              >
                {r.doneToday && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5 text-black"
                  >
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-sm', r.doneToday ? 'text-ivory-dim' : 'text-ivory')}>
                  {r.name}
                </span>
                {r.anchor && (
                  <span className="block truncate text-xs text-muted">{r.anchor}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard/rhythms"
        prefetch
        className="mt-4 inline-block text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
      >
        Open rhythms &rarr;
      </Link>
    </div>
  );
}
