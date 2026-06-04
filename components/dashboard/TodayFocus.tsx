'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { toggleToday } from '@/app/dashboard/(app)/rhythms/actions';

/**
 * The single "one thing for today" tap-target for the Today screen.
 *
 * It surfaces the member's next undone daily practice as one large button.
 * Tapping it completes the practice (the existing toggleToday mutation,
 * optimistic) and then shows a clear, kind stopping point: "That is enough for
 * today. Well done." No checklist, no streak to fail — one thing and grace.
 * The full set of rhythms is always one quiet link away.
 */
interface NextPractice {
  id: string;
  name: string;
  anchor: string;
  scripture: string;
}

export function TodayFocus({
  next,
  allDone,
  hasRhythms,
}: {
  next: NextPractice | null;
  allDone: boolean;
  hasRhythms: boolean;
}) {
  const [done, setDone] = useState(allDone);
  const [, startTransition] = useTransition();

  // No rhythms set up yet — a gentle invitation, never a scold.
  if (!hasRhythms) {
    return (
      <section className="rounded-md border border-border-sub bg-black-3 p-7 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          One thing for today
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-silver">
          Your daily rhythms will live here, one small practice to return to each day.
        </p>
        <Link
          href="/dashboard/rhythms"
          prefetch
          className="mt-5 inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-black transition-colors hover:bg-gold-lt"
        >
          Set up your rhythms &rarr;
        </Link>
      </section>
    );
  }

  // Done for today (already, or just completed) — the stopping point.
  if (done || !next) {
    return (
      <section className="rounded-md border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-8 text-center">
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7">
            <path
              d="M5 12.5l4 4 10-11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
        <p className="font-display text-2xl font-light text-ivory">That is enough for today.</p>
        <p className="font-display text-2xl font-light text-gold-lt">Well done.</p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-silver">
          Rest in what he has already done. There is nothing to keep up with here. Come back tomorrow.
        </p>
        <Link
          href="/dashboard/rhythms"
          prefetch
          className="mt-5 inline-block text-[11px] font-medium uppercase tracking-[0.08em] text-gold transition-colors hover:text-gold-lt"
        >
          See all your rhythms &rarr;
        </Link>
      </section>
    );
  }

  function complete() {
    const p = next!;
    setDone(true);
    startTransition(async () => {
      try {
        await toggleToday(p.id);
      } catch {
        // Roll back on failure so the member can try again.
        setDone(false);
      }
    });
  }

  return (
    <section className="rounded-md border border-border-sub bg-black-3 p-6 md:p-7">
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        One thing for today
      </p>
      <button
        type="button"
        onClick={complete}
        className="group flex w-full items-center gap-4 rounded-md border border-border-sub bg-black-2 p-5 text-left transition-colors hover:border-border-gold"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-gold text-gold transition-colors group-hover:bg-gold group-hover:text-black">
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              d="M5 12.5l4 4 10-11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-light text-ivory">{next.name}</span>
          {next.anchor && <span className="mt-0.5 block text-sm text-silver">{next.anchor}</span>}
        </span>
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        {next.scripture ? `${next.scripture} · ` : ''}Tap when you have done it. One thing is enough.
      </p>
    </section>
  );
}
