'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GRATITUDE_PROMPTS } from '@/lib/dashboard/content';
import type { GratitudeEntry } from '@/lib/supabase';
import { saveGratitude } from '@/app/dashboard/(app)/reflect/actions';
import { SaveNote, SAVE_FAILED } from './SaveNote';

interface GratitudeCardProps {
  initialGratitude: GratitudeEntry | null;
}

export function GratitudeCard({ initialGratitude }: GratitudeCardProps) {
  const [itemOne, setItemOne] = useState(initialGratitude?.item_one ?? '');
  const [itemTwo, setItemTwo] = useState(initialGratitude?.item_two ?? '');
  const [itemThree, setItemThree] = useState(initialGratitude?.item_three ?? '');
  const [saved, setSaved] = useState(!!initialGratitude);
  const [note, setNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pick a prompt that rotates by the day. Stable within the session.
  const prompt = useMemo(() => {
    const day = new Date().getUTCDate();
    return GRATITUDE_PROMPTS[day % GRATITUDE_PROMPTS.length];
  }, []);

  function handleSave() {
    if (!itemOne.trim() && !itemTwo.trim() && !itemThree.trim()) return;
    setNote(null);
    startTransition(async () => {
      try {
        await saveGratitude({ itemOne, itemTwo, itemThree });
        setSaved(true);
      } catch (err) {
        console.error('saveGratitude failed', err);
        setNote(SAVE_FAILED);
      }
    });
  }

  return (
    <article className="flex flex-col gap-5 rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold">
      <header>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Gratitude
        </p>
        <h2 className="font-display text-2xl font-light text-ivory">Three good things</h2>
        <p className="mt-2 text-sm italic text-silver">{prompt}</p>
      </header>

      <div className="flex flex-col gap-3">
        {[
          { value: itemOne, setter: setItemOne, placeholder: 'First thing' },
          { value: itemTwo, setter: setItemTwo, placeholder: 'Second thing' },
          { value: itemThree, setter: setItemThree, placeholder: 'Third thing (optional)' },
        ].map(({ value, setter, placeholder }, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              {idx + 1}
            </span>
            <textarea
              value={value}
              onChange={(e) => {
                setter(e.target.value);
                setSaved(false);
              }}
              placeholder={placeholder}
              rows={2}
              maxLength={300}
              className="flex-1 rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || (!itemOne.trim() && !itemTwo.trim() && !itemThree.trim())}
        className="w-full rounded-sm border border-gold/45 bg-transparent px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-60"
      >
        {isPending ? 'Saving...' : saved ? 'Saved' : 'Save gratitude'}
      </button>

      <SaveNote message={note} />

      <AnimatePresence>
        {saved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-silver"
          >
            Recorded. Gratitude does something to the soul.
          </motion.p>
        )}
      </AnimatePresence>
    </article>
  );
}
