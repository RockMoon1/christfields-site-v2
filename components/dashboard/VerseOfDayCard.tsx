'use client';

import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { type VerseOfDay } from '@/lib/dashboard/content';
import { saveVerseOfDay } from '@/app/dashboard/(app)/scripture/actions';

interface VerseOfDayCardProps {
  verse: VerseOfDay;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'already';

export function VerseOfDayCard({ verse }: VerseOfDayCardProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (saveState === 'saved' || saveState === 'already' || isPending) return;
    setSaveState('saving');

    startTransition(async () => {
      try {
        const result = await saveVerseOfDay();
        setSaveState(result === null ? 'already' : 'saved');
      } catch (err) {
        console.error('saveVerseOfDay failed', err);
        setSaveState('idle');
      }
    });
  }

  function handleCopy() {
    const text = `${verse.verse_text} ${verse.reference}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const saveLabel =
    saveState === 'saving'
      ? 'Saving...'
      : saveState === 'saved'
        ? 'Saved to memory'
        : saveState === 'already'
          ? 'Already saved'
          : 'Save to memory';

  const isSaveDone = saveState === 'saved' || saveState === 'already';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-sm border border-border-gold bg-black-3"
    >
      {/* Ambient gold shimmer at top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      {/* Soft radial glow behind the text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, #c9a548 0%, transparent 80%)',
        }}
      />

      <div className="relative px-8 py-10 md:px-12 md:py-14">
        {/* Eyebrow */}
        <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Verse of the day
        </p>

        {/* Verse text */}
        <blockquote>
          <p className="font-display text-2xl font-light leading-relaxed text-ivory md:text-3xl lg:text-4xl">
            {verse.verse_text}
          </p>

          {/* Reference + translation */}
          <footer className="mt-6 flex items-center gap-3">
            <span
              aria-hidden
              className="h-px w-6 flex-none bg-gold/40"
            />
            <cite className="not-italic text-sm font-light uppercase tracking-[0.16em] text-gold-lt">
              {verse.reference}
            </cite>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
              {verse.translation}
            </span>
          </footer>
        </blockquote>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || isSaveDone}
            className={cn(
              'rounded-sm px-5 py-2 text-[11px] font-medium uppercase tracking-[0.07em] transition-all duration-300',
              isSaveDone
                ? 'border border-emerald-lt/40 bg-transparent text-emerald-lt cursor-default'
                : 'border border-gold/45 bg-transparent text-gold hover:bg-gold hover:text-black disabled:opacity-60',
            )}
          >
            {isSaveDone && (
              <span aria-hidden className="mr-1.5">
                {saveState === 'saved' ? '✓' : '·'}
              </span>
            )}
            {saveLabel}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="rounded-sm border border-border-sub px-5 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
          >
            {copied ? 'Copied' : 'Copy verse'}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
