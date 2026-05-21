'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { REFRAME_HELPS, REFRAME_STEPS } from '@/lib/dashboard/content';
import type { ThoughtRecord } from '@/lib/supabase';
import { saveThoughtRecord } from '@/app/dashboard/(app)/reflect/actions';

interface ReframeCardProps {
  reframes: ThoughtRecord[];
}

export function ReframeCard({ reframes }: ReframeCardProps) {
  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [reframe, setReframe] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const chosenHelp = REFRAME_HELPS.find((h) => h.theme === selectedTheme) ?? null;

  const values: Record<string, string> = { situation, thought, reframe };
  const setters: Record<string, (v: string) => void> = {
    situation: setSituation,
    thought: setThought,
    reframe: setReframe,
  };

  function handleThemeSelect(theme: string) {
    setSelectedTheme((prev) => (prev === theme ? null : theme));
    setSaved(false);
  }

  function handleSave() {
    if (!thought.trim()) return;
    const scriptureRef = chosenHelp?.scripture_ref ?? '';
    startTransition(async () => {
      try {
        await saveThoughtRecord({ situation, thought, reframe, scriptureRef });
        setSaved(true);
        setSituation('');
        setThought('');
        setReframe('');
        setSelectedTheme(null);
      } catch (err) {
        console.error('saveThoughtRecord failed', err);
      }
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* New reframe form */}
      <div className="flex flex-col gap-5 rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold">
        <header>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
            Thought Reframe
          </p>
          <h2 className="font-display text-2xl font-light text-ivory">Renew your mind</h2>
          <p className="mt-2 text-xs text-silver">
            "Be transformed by the renewing of your mind." Romans 12:2
          </p>
        </header>

        {/* Theme picker */}
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            What is this about? (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {REFRAME_HELPS.map((help) => (
              <button
                key={help.theme}
                type="button"
                onClick={() => handleThemeSelect(help.theme)}
                className={cn(
                  'rounded-sm border px-2.5 py-1 text-[11px] tracking-wide transition-all',
                  selectedTheme === help.theme
                    ? 'border-gold/50 bg-gold/10 text-gold-lt'
                    : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
                )}
              >
                {help.theme}
              </button>
            ))}
          </div>
        </div>

        {/* Help line */}
        <AnimatePresence>
          {chosenHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-sm border-l-2 border-gold/50 bg-black-4 px-4 py-3"
            >
              <p className="text-sm leading-relaxed text-ivory-dim">{chosenHelp.line}</p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                {chosenHelp.scripture_ref}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reframe steps */}
        <div className="flex flex-col gap-4">
          {REFRAME_STEPS.map((step) => (
            <div key={step.key} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                {step.title}
              </label>
              <p className="text-xs text-muted">{step.prompt}</p>

              {/* For the reframe step, show the scripture reference as a gentle anchor */}
              {step.key === 'reframe' && chosenHelp && (
                <p className="text-[10px] italic text-silver">
                  Anchor: {chosenHelp.scripture_ref}
                </p>
              )}

              <textarea
                value={values[step.key]}
                onChange={(e) => {
                  setters[step.key](e.target.value);
                  setSaved(false);
                }}
                placeholder={step.prompt}
                rows={step.key === 'reframe' ? 3 : 2}
                maxLength={step.key === 'reframe' ? 1000 : 500}
                className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !thought.trim()}
          className="w-full rounded-sm border border-gold/45 bg-transparent px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-60"
        >
          {isPending ? 'Saving...' : saved ? 'Saved' : 'Save reframe'}
        </button>

        <AnimatePresence>
          {saved && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-silver"
            >
              Written down. The mind that names a thought can begin to change it.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Past reframes */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
            Your growth
          </p>
          <p className="text-[10px] text-muted">{reframes.length} records</p>
        </div>

        {reframes.length === 0 ? (
          <p className="text-sm italic text-muted">
            Your past reframes will show here. Each one is evidence of growth.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {reframes.map((record) => (
              <div
                key={record.id}
                className="rounded-sm border border-border-sub bg-black-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((prev) => (prev === record.id ? null : record.id))
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ivory">{record.thought}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-muted">
                        {record.entry_date}
                      </span>
                      {record.scripture_ref && (
                        <span className="text-[10px] text-gold">{record.scripture_ref}</span>
                      )}
                    </div>
                  </div>
                  <ChevronIcon
                    className={cn(
                      'ml-3 h-3.5 w-3.5 flex-shrink-0 text-muted transition-transform',
                      expandedId === record.id ? 'rotate-180' : '',
                    )}
                  />
                </button>

                <AnimatePresence>
                  {expandedId === record.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 border-t border-border-sub px-4 py-4">
                        {record.situation && (
                          <div>
                            <p className="mb-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                              What happened
                            </p>
                            <p className="text-sm text-silver">{record.situation}</p>
                          </div>
                        )}
                        <div>
                          <p className="mb-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                            The thought
                          </p>
                          <p className="text-sm text-silver">{record.thought}</p>
                        </div>
                        {record.reframe && (
                          <div>
                            <p className="mb-0.5 text-[10px] uppercase tracking-[0.16em] text-gold">
                              A truer word
                            </p>
                            <p className="text-sm text-ivory">{record.reframe}</p>
                          </div>
                        )}
                        {record.scripture_ref && (
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                            {record.scripture_ref}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
