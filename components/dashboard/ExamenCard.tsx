'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EXAMEN_STEPS, EXAMEN_CLOSING } from '@/lib/dashboard/content';
import type { Reflection } from '@/lib/supabase';
import { saveExamen } from '@/app/dashboard/(app)/reflect/actions';
import { SaveNote, SAVE_FAILED } from './SaveNote';

interface ExamenCardProps {
  initialExamen: Reflection | null;
}

export function ExamenCard({ initialExamen }: ExamenCardProps) {
  const [consolation, setConsolation] = useState(initialExamen?.consolation ?? '');
  const [desolation, setDesolation] = useState(initialExamen?.desolation ?? '');
  const [intention, setIntention] = useState(initialExamen?.intention ?? '');
  const [saved, setSaved] = useState(!!initialExamen);
  const [note, setNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const values: Record<string, string> = { consolation, desolation, intention };
  const setters: Record<string, (v: string) => void> = {
    consolation: setConsolation,
    desolation: setDesolation,
    intention: setIntention,
  };

  function handleSave() {
    setNote(null);
    startTransition(async () => {
      try {
        await saveExamen({ consolation, desolation, intention });
        setSaved(true);
      } catch (err) {
        console.error('saveExamen failed', err);
        setNote(SAVE_FAILED);
      }
    });
  }

  const hasAny = consolation.trim() || desolation.trim() || intention.trim();

  return (
    <div className="flex flex-col gap-6 rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold">
      <header>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Evening Examen
        </p>
        <h2 className="font-display text-2xl font-light text-ivory">End the day with God</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver">
          A simple Ignatian review. Honest answers, no score.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {EXAMEN_STEPS.map((step) => (
          <div key={step.key} className="flex flex-col gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                {step.title}
              </p>
              <p className="mt-1 text-sm text-ivory">{step.prompt}</p>
              <p className="mt-0.5 text-xs italic text-muted">{step.hint}</p>
            </div>
            <textarea
              value={values[step.key]}
              onChange={(e) => {
                setters[step.key](e.target.value);
                setSaved(false);
              }}
              placeholder="Your honest answer..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !hasAny}
        className="w-full rounded-sm border border-gold/45 bg-transparent px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-60"
      >
        {isPending ? 'Saving...' : saved ? 'Saved' : 'Save examen'}
      </button>

      <SaveNote message={note} />

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-sm border border-border-gold bg-black-4 p-4"
          >
            <p className="text-sm leading-relaxed text-ivory-dim">{EXAMEN_CLOSING}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
