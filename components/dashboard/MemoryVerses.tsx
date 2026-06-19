'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { type MemoryVerse, type MemoryStatus } from '@/lib/supabase';
import {
  addVerse,
  reviewVerse,
  setVerseStatus,
  deleteVerse,
  lookupVerseText,
} from '@/app/dashboard/(app)/scripture/actions';

interface MemoryVersesProps {
  learning: MemoryVerse[];
  memorized: MemoryVerse[];
  dueCount: number;
}

export function MemoryVerses({ learning, memorized, dueCount }: MemoryVersesProps) {
  const [learningList, setLearningList] = useOptimistic<MemoryVerse[]>(learning);
  const [memorizedList, setMemorizedList] = useOptimistic<MemoryVerse[]>(memorized);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  // --- Add verse ---
  function handleAdd(input: { reference: string; verseText: string; translation: string }) {
    const tempId = `temp-${Date.now()}`;
    const optimistic: MemoryVerse = {
      id: tempId,
      clerk_user_id: '',
      reference: input.reference.trim(),
      verse_text: input.verseText.trim(),
      translation: input.translation.trim() || 'ESV',
      status: 'learning',
      reviews: 0,
      last_reviewed: null,
      created_at: new Date().toISOString(),
    };

    setShowAdd(false);

    startTransition(async () => {
      setLearningList((prev) => [optimistic, ...prev]);
      try {
        const real = await addVerse(input);
        setLearningList((prev) => prev.map((v) => (v.id === tempId ? real : v)));
      } catch (err) {
        setLearningList((prev) => prev.filter((v) => v.id !== tempId));
        console.error('addVerse failed', err);
      }
    });
  }

  // --- Review ---
  function handleReview(id: string) {
    startTransition(async () => {
      setLearningList((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, reviews: v.reviews + 1, last_reviewed: new Date().toISOString() }
            : v,
        ),
      );
      try {
        await reviewVerse(id);
      } catch (err) {
        console.error('reviewVerse failed', err);
      }
    });
  }

  // --- Move to memorized ---
  function handleMoveToMemorized(id: string) {
    const verse = learningList.find((v) => v.id === id);
    if (!verse) return;

    startTransition(async () => {
      setLearningList((prev) => prev.filter((v) => v.id !== id));
      setMemorizedList((prev) => [{ ...verse, status: 'memorized' }, ...prev]);
      try {
        await setVerseStatus(id, 'memorized');
      } catch (err) {
        setLearningList((prev) => [verse, ...prev]);
        setMemorizedList((prev) => prev.filter((v) => v.id !== id));
        console.error('setVerseStatus failed', err);
      }
    });
  }

  // --- Move back to learning ---
  function handleMoveToLearning(id: string) {
    const verse = memorizedList.find((v) => v.id === id);
    if (!verse) return;

    startTransition(async () => {
      setMemorizedList((prev) => prev.filter((v) => v.id !== id));
      setLearningList((prev) => [{ ...verse, status: 'learning' }, ...prev]);
      try {
        await setVerseStatus(id, 'learning');
      } catch (err) {
        setMemorizedList((prev) => [verse, ...prev]);
        setLearningList((prev) => prev.filter((v) => v.id !== id));
        console.error('setVerseStatus failed', err);
      }
    });
  }

  // --- Delete ---
  function handleDelete(id: string, from: MemoryStatus) {
    const verse =
      from === 'learning'
        ? learningList.find((v) => v.id === id)
        : memorizedList.find((v) => v.id === id);

    startTransition(async () => {
      if (from === 'learning') {
        setLearningList((prev) => prev.filter((v) => v.id !== id));
      } else {
        setMemorizedList((prev) => prev.filter((v) => v.id !== id));
      }
      try {
        await deleteVerse(id);
      } catch (err) {
        if (verse) {
          if (from === 'learning') {
            setLearningList((prev) => [verse, ...prev]);
          } else {
            setMemorizedList((prev) => [verse, ...prev]);
          }
        }
        console.error('deleteVerse failed', err);
      }
    });
  }

  return (
    <section className="space-y-8">
      {/* ---- Learning header ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-light text-ivory">Learning</h2>
          {dueCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-gold-lt"
            >
              {dueCount} due for review
            </motion.span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="rounded-sm border border-border-sub px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
        >
          {showAdd ? 'Cancel' : '+ Add verse'}
        </button>
      </div>

      {/* ---- Add form ---- */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <AddVerseForm
              onCancel={() => setShowAdd(false)}
              onSubmit={handleAdd}
              isPending={isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Leader testing note ---- */}
      <p className="text-sm leading-relaxed text-silver/80 italic">
        Your leader may test you on these. If you are not ready for one yet, they can clear it, and you can always pick it back up later.
      </p>

      {/* ---- Learning list ---- */}
      {learningList.length === 0 && !showAdd && (
        <EmptyState message="No verses in progress. Add one above or save today's verse." />
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {learningList.map((verse) => (
            <motion.div
              key={verse.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <LearningCard
                verse={verse}
                onReview={handleReview}
                onMoveToMemorized={handleMoveToMemorized}
                onDelete={(id) => handleDelete(id, 'learning')}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ---- Memorized section ---- */}
      {(memorizedList.length > 0 || learningList.length > 0) && (
        <div className="pt-4">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-display text-2xl font-light text-ivory">Memorized</h2>
            {memorizedList.length > 0 && (
              <span className="text-xs text-silver">
                {memorizedList.length}{' '}
                {memorizedList.length === 1 ? 'verse' : 'verses'} hidden in your heart
              </span>
            )}
          </div>

          {memorizedList.length === 0 ? (
            <EmptyState message="Verses you have fully memorized will appear here." dim />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {memorizedList.map((verse) => (
                  <motion.div
                    key={verse.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <MemorizedCard
                      verse={verse}
                      onMoveToLearning={handleMoveToLearning}
                      onDelete={(id) => handleDelete(id, 'memorized')}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   Add verse form
   ============================================================ */

interface AddVerseFormProps {
  onCancel: () => void;
  onSubmit: (input: { reference: string; verseText: string; translation: string }) => void;
  isPending: boolean;
}

function AddVerseForm({ onCancel, onSubmit, isPending }: AddVerseFormProps) {
  const [reference, setReference] = useState('');
  const [verseText, setVerseText] = useState('');
  const [translation, setTranslation] = useState('ESV');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');

  async function lookUp() {
    const ref = reference.trim();
    if (ref.length < 2) {
      setLookupError('Type a reference first, like John 3:16.');
      return;
    }
    setLookupError('');
    setLooking(true);
    try {
      const result = await lookupVerseText(ref);
      if (result.ok && result.text) {
        setVerseText(result.text);
        if (result.translation) setTranslation(result.translation);
        if (result.reference) setReference(result.reference);
      } else {
        setLookupError(result.error ?? 'Could not find that reference.');
      }
    } catch {
      setLookupError('Could not look that up right now. You can paste the text instead.');
    } finally {
      setLooking(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !verseText.trim()) return;
    onSubmit({ reference, verseText, translation });
    setReference('');
    setVerseText('');
    setTranslation('ESV');
    setLookupError('');
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-sm border border-border-gold bg-black-3 p-6 space-y-4"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        Add a verse to memorize
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={reference}
          onChange={(e) => {
            setReference(e.target.value);
            setLookupError('');
          }}
          placeholder="Reference (e.g. Romans 8:1)"
          autoFocus
          maxLength={100}
          className="min-w-0 flex-1 rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={lookUp}
          disabled={looking || reference.trim().length < 2}
          className="flex-none rounded-sm border border-gold/45 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-50"
        >
          {looking ? 'Looking…' : 'Look up'}
        </button>
      </div>
      <p className="-mt-2 text-[11px] leading-relaxed text-muted">
        Type the reference and tap Look up for the verified text (World English Bible, public
        domain), or paste your own below.
      </p>
      {lookupError && <p className="-mt-1 text-xs text-red-400">{lookupError}</p>}

      <textarea
        value={verseText}
        onChange={(e) => setVerseText(e.target.value)}
        placeholder="Paste or type the verse text here, or use Look up above."
        rows={3}
        maxLength={1000}
        className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none resize-none"
      />

      <input
        type="text"
        value={translation}
        onChange={(e) => setTranslation(e.target.value)}
        placeholder="Translation (e.g. ESV, NIV)"
        maxLength={20}
        className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending || !reference.trim() || !verseText.trim()}
          className="flex-1 rounded-sm bg-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Add verse'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-border-sub px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   Learning card with reveal-to-review flow
   ============================================================ */

interface LearningCardProps {
  verse: MemoryVerse;
  onReview: (id: string) => void;
  onMoveToMemorized: (id: string) => void;
  onDelete: (id: string) => void;
}

function LearningCard({ verse, onReview, onMoveToMemorized, onDelete }: LearningCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [offerMemorized, setOfferMemorized] = useState(false);
  const isTemp = verse.id.startsWith('temp-');

  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const isDue =
    !verse.last_reviewed || new Date(verse.last_reviewed).getTime() < twoDaysAgo;

  function handleGotIt() {
    onReview(verse.id);
    const nextReviews = verse.reviews + 1;
    if (nextReviews >= 3) {
      setOfferMemorized(true);
    }
    setRevealed(false);
  }

  function handleKeepPracticing() {
    onReview(verse.id);
    setRevealed(false);
  }

  return (
    <article className="group relative rounded-sm border border-border-sub bg-black-3 p-5 transition-colors hover:border-border-gold">
      {/* Due indicator */}
      {isDue && !isTemp && (
        <span className="absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-gold opacity-80" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-light text-ivory">{verse.reference}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
            {verse.translation}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(verse.id)}
          disabled={isTemp}
          aria-label={`Remove ${verse.reference}`}
          className="mt-0.5 text-muted opacity-0 transition-opacity hover:text-silver group-hover:opacity-100 disabled:cursor-not-allowed"
        >
          <XIcon />
        </button>
      </div>

      {/* Verse text: hidden until revealed */}
      <AnimatePresence>
        {revealed && (
          <motion.p
            key="verse-text"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 overflow-hidden font-display text-base font-light leading-relaxed text-ivory-dim"
          >
            {verse.verse_text}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Review actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={isTemp}
            className="rounded-sm border border-border-sub px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-silver transition-colors hover:border-border-gold hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reveal
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGotIt}
              className="rounded-sm border border-emerald-lt/40 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-bright transition-colors hover:bg-emerald-lt/10"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={handleKeepPracticing}
              className="rounded-sm border border-border-sub px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
            >
              Keep practicing
            </button>
          </>
        )}

        {/* Reviews count */}
        <span className="ml-auto text-[10px] text-muted">
          {verse.reviews} {verse.reviews === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {/* Offer to move to memorized after 3+ reviews */}
      <AnimatePresence>
        {offerMemorized && (
          <motion.div
            key="offer-memorized"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-center justify-between rounded-sm border border-emerald-lt/20 bg-emerald-lt/5 px-4 py-3">
              <p className="text-xs text-silver">
                You have reviewed this several times. Move it to memorized?
              </p>
              <div className="ml-4 flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onMoveToMemorized(verse.id);
                    setOfferMemorized(false);
                  }}
                  className="rounded-sm bg-emerald-lt/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-bright transition-colors hover:bg-emerald-lt/30"
                >
                  Move
                </button>
                <button
                  type="button"
                  onClick={() => setOfferMemorized(false)}
                  className="text-[10px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-silver"
                >
                  Not yet
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

/* ============================================================
   Memorized card
   ============================================================ */

interface MemorizedCardProps {
  verse: MemoryVerse;
  onMoveToLearning: (id: string) => void;
  onDelete: (id: string) => void;
}

function MemorizedCard({ verse, onMoveToLearning, onDelete }: MemorizedCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="group rounded-sm border border-border-sub bg-black-2/60 px-5 py-4 transition-colors hover:border-border-gold">
      <div className="flex items-center gap-3">
        <CheckIcon />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-light text-ivory-dim">{verse.reference}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setExpanded((s) => !s)}
            className="text-[9px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-silver"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={() => onMoveToLearning(verse.id)}
            className="text-[9px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-gold"
          >
            Back to learning
          </button>
          <button
            type="button"
            onClick={() => onDelete(verse.id)}
            aria-label={`Remove ${verse.reference}`}
            className="text-muted transition-colors hover:text-silver"
          >
            <XIcon />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.p
            key="text"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 overflow-hidden font-display text-sm font-light leading-relaxed text-muted"
          >
            {verse.verse_text}
          </motion.p>
        )}
      </AnimatePresence>
    </article>
  );
}

/* ============================================================
   Empty state
   ============================================================ */

function EmptyState({ message, dim }: { message: string; dim?: boolean }) {
  return (
    <p className={cn('py-4 text-sm italic', dim ? 'text-muted' : 'text-silver')}>
      {message}
    </p>
  );
}

/* ============================================================
   Icons
   ============================================================ */

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 flex-none text-emerald-bright">
      <path
        d="M3 8l3.5 3.5L13 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
