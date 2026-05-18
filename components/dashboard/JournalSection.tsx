'use client';

import { useState, useTransition, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  addJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
} from '@/app/dashboard/(app)/resources/actions';
import { journalPromptFor, type Tier } from '@/lib/resources';

interface JournalSectionProps {
  areaId: string;
  areaColor: string;
  tier: Tier;
  initialEntries: JournalEntry[];
}

const MAX_LEN = 4000;

/**
 * The reflection box at the bottom of every resource card.
 * Prompt changes by tier. Includes spring focus animation, animated character
 * count, ripple on save, and a fade/slide history of past entries.
 */
export function JournalSection({
  areaId,
  areaColor,
  tier,
  initialEntries,
}: JournalSectionProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [body, setBody] = useState('');
  const [focused, setFocused] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompt = journalPromptFor(tier);
  const charsClass =
    body.length > MAX_LEN * 0.85
      ? 'text-gold'
      : body.length > 0
        ? 'text-silver'
        : 'text-muted';

  function handleSave() {
    if (!body.trim() || isPending) return;
    const text = body.trim();
    const tempId = `temp-${Date.now()}`;
    setEntries((prev) => [
      { id: tempId, body: text, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setBody('');
    setError(null);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);

    startTransition(async () => {
      try {
        const saved = await addJournalEntry(areaId, text);
        setEntries((prev) => prev.map((e) => (e.id === tempId ? saved : e)));
      } catch (err) {
        setEntries((prev) => prev.filter((e) => e.id !== tempId));
        setError('Could not save. Please try again.');
        console.error(err);
      }
    });
  }

  function handleDelete(id: string) {
    const removed = entries.find((e) => e.id === id);
    setEntries((prev) => prev.filter((e) => e.id !== id));

    startTransition(async () => {
      try {
        await deleteJournalEntry(id);
      } catch (err) {
        if (removed) setEntries((prev) => [removed, ...prev]);
        setError('Could not delete. Please try again.');
        console.error(err);
      }
    });
  }

  return (
    <section className="border-t border-border-sub px-7 py-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ color: areaColor }}
        >
          Reflect
        </p>
        <p className={`text-[10px] tabular-nums ${charsClass}`}>
          {body.length} / {MAX_LEN}
        </p>
      </div>

      {/* Tier-specific prompt */}
      <h4 className="mb-1 font-display text-xl font-light leading-tight text-ivory md:text-2xl">
        {prompt.question}
      </h4>
      {prompt.hint && (
        <p className="mb-4 text-xs italic text-silver">{prompt.hint}</p>
      )}

      {/* Textarea wrapper with animated glow on focus */}
      <motion.div
        animate={{
          scale: focused ? 1.005 : 1,
          boxShadow: focused
            ? `0 0 0 1px ${areaColor}99, 0 0 24px ${areaColor}33`
            : `0 0 0 1px ${areaColor}22`,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="overflow-hidden rounded-sm bg-black-2"
      >
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type freely. No one reads this but you."
          rows={4}
          className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-ivory placeholder:text-muted focus:outline-none"
        />
      </motion.div>

      {/* Save row */}
      <div className="mt-3 flex items-center gap-3">
        <motion.button
          type="button"
          onClick={handleSave}
          disabled={isPending || body.trim().length === 0}
          whileTap={{ scale: 0.96 }}
          animate={
            justSaved
              ? { backgroundColor: areaColor, color: '#000' }
              : { backgroundColor: 'transparent', color: areaColor }
          }
          transition={{ duration: 0.4 }}
          style={{ borderColor: `${areaColor}77` }}
          className="rounded-sm border px-5 py-2 text-[11px] font-medium uppercase tracking-[0.07em] transition-opacity disabled:opacity-40"
        >
          {justSaved ? 'Saved' : isPending ? 'Saving…' : 'Save reflection'}
        </motion.button>

        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Subtle ripple emitted on save */}
        <AnimatePresence>
          {justSaved && (
            <motion.span
              key="ripple"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ backgroundColor: areaColor }}
              className="pointer-events-none ml-[-100px] inline-block h-4 w-4 rounded-full"
              aria-hidden
            />
          )}
        </AnimatePresence>
      </div>

      {/* Past entries */}
      {entries.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Past reflections
          </p>
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {entries.map((e) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative rounded-sm border border-border-sub bg-black-2 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-muted">
                    <span>{formatDate(e.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className="opacity-0 transition-opacity hover:text-silver group-hover:opacity-100"
                      aria-label="Delete entry"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ivory-dim">
                    {e.body}
                  </p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
