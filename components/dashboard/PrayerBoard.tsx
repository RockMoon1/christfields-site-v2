'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { type PrayerRequest } from '@/lib/supabase';
import { PRAYER_CATEGORIES } from '@/lib/dashboard/content';
import {
  addPrayer,
  markAnswered,
  reopenPrayer,
  deletePrayer,
  shareToCommunity,
} from '@/app/dashboard/(app)/prayer/actions';

interface PrayerBoardProps {
  initialOpen: PrayerRequest[];
  initialAnswered: PrayerRequest[];
}

/** How long ago a date string was, as a short human label. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

/**
 * PrayerBoard is the interactive client shell for the Prayer page.
 * It manages two lists (open requests and answered prayers) with
 * optimistic updates, transitions, and a gentle celebration when
 * a prayer gets marked as answered.
 */
export function PrayerBoard({ initialOpen, initialAnswered }: PrayerBoardProps) {
  const [open, setOpen] = useState<PrayerRequest[]>(initialOpen);
  const [answered, setAnswered] = useState<PrayerRequest[]>(initialAnswered);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Failures used to be console-only, so a rolled-back optimistic update just
  // looked like the app forgetting what the member did. Say it plainly instead.
  const [note, setNote] = useState<string | null>(null);

  // Called from AddPrayerForm with the form values.
  function handleAdd(input: { title: string; body: string; category: string }) {
    const tempId = `temp-${Date.now()}`;
    const optimistic: PrayerRequest = {
      id: tempId,
      clerk_user_id: '',
      title: input.title,
      body: input.body,
      category: input.category,
      status: 'open',
      answered_note: '',
      answered_at: null,
      shared: false,
      created_at: new Date().toISOString(),
    };

    setOpen((prev) => [optimistic, ...prev]);
    setShowAdd(false);
    setNote(null);

    startTransition(async () => {
      try {
        const real = await addPrayer(input);
        setOpen((prev) => prev.map((r) => (r.id === tempId ? real : r)));
      } catch (err) {
        setOpen((prev) => prev.filter((r) => r.id !== tempId));
        console.error(err);
        setNote('Could not save that prayer. Please try again.');
      }
    });
  }

  function handleMarkAnswered(id: string, answeredNote: string) {
    // A prayer still being saved has no real id yet; acting on it would send
    // "temp-..." to a uuid column and bounce straight back.
    if (id.startsWith('temp-')) {
      setNote('Still saving that one. Give it a second and try again.');
      return;
    }
    const request = open.find((r) => r.id === id);
    if (!request) return;

    const updated: PrayerRequest = {
      ...request,
      status: 'answered',
      answered_at: new Date().toISOString(),
      answered_note: answeredNote,
    };

    setOpen((prev) => prev.filter((r) => r.id !== id));
    setAnswered((prev) => [updated, ...prev]);
    setNote(null);

    startTransition(async () => {
      try {
        await markAnswered(id, answeredNote);
      } catch (err) {
        // Roll back: put it back in open.
        setOpen((prev) => [request, ...prev]);
        setAnswered((prev) => prev.filter((r) => r.id !== id));
        console.error(err);
        setNote('Could not mark that answered. Please try again.');
      }
    });
  }

  function handleReopen(id: string) {
    if (id.startsWith('temp-')) {
      setNote('Still saving that one. Give it a second and try again.');
      return;
    }
    const request = answered.find((r) => r.id === id);
    if (!request) return;

    const updated: PrayerRequest = {
      ...request,
      status: 'open',
      answered_at: null,
      answered_note: '',
    };

    setAnswered((prev) => prev.filter((r) => r.id !== id));
    setOpen((prev) => [updated, ...prev]);
    setNote(null);

    startTransition(async () => {
      try {
        await reopenPrayer(id);
      } catch (err) {
        setAnswered((prev) => [request, ...prev]);
        setOpen((prev) => prev.filter((r) => r.id !== id));
        console.error(err);
        setNote('Could not reopen that prayer. Please try again.');
      }
    });
  }

  function handleDelete(id: string) {
    if (id.startsWith('temp-')) {
      setNote('Still saving that one. Give it a second and try again.');
      return;
    }
    const fromOpen = open.find((r) => r.id === id);
    const fromAnswered = answered.find((r) => r.id === id);

    if (fromOpen) setOpen((prev) => prev.filter((r) => r.id !== id));
    if (fromAnswered) setAnswered((prev) => prev.filter((r) => r.id !== id));
    setNote(null);

    startTransition(async () => {
      try {
        await deletePrayer(id);
      } catch (err) {
        if (fromOpen) setOpen((prev) => [fromOpen, ...prev]);
        if (fromAnswered) setAnswered((prev) => [fromAnswered, ...prev]);
        console.error(err);
        setNote('Could not remove that prayer. It is still here.');
      }
    });
  }

  function handleShare(id: string) {
    if (id.startsWith('temp-')) {
      setNote('Still saving that one. Give it a second and try again.');
      return;
    }
    setNote(null);
    startTransition(async () => {
      try {
        await shareToCommunity(id);
        // Only mark shared once the wall actually received it.
        setOpen((prev) =>
          prev.map((r) => (r.id === id ? { ...r, shared: true } : r)),
        );
        setAnswered((prev) =>
          prev.map((r) => (r.id === id ? { ...r, shared: true } : r)),
        );
      } catch (err) {
        console.error(err);
        setNote('Could not share that prayer right now. Please try again.');
      }
    });
  }

  return (
    <div>
      {/* Save failures, said plainly. aria-live so it is announced, not just seen. */}
      <div aria-live="polite">
        {note && (
          <p className="mb-6 rounded-sm border border-gold/35 bg-gold/[0.07] px-4 py-3 text-sm text-ivory-dim">
            {note}
          </p>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      {/* Left: open requests */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-light text-ivory">
            Praying for
          </h2>
          {!showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-sm border border-border-sub px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
            >
              <PlusIcon />
              Add request
            </button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {showAdd && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5"
            >
              <AddPrayerForm
                onCancel={() => setShowAdd(false)}
                onSubmit={handleAdd}
                isPending={isPending}
              />
            </motion.div>
          )}

          {open.length === 0 && !showAdd && (
            <motion.div
              key="open-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-sm border border-dashed border-border-sub p-8 text-center"
            >
              <p className="font-display text-xl font-light text-ivory-dim">
                Nothing here yet.
              </p>
              <p className="mt-1 text-sm text-silver">
                What are you carrying? Bring it here.
              </p>
            </motion.div>
          )}

          {open.map((request) => (
            <motion.div
              key={request.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4"
            >
              <OpenCard
                request={request}
                onMarkAnswered={handleMarkAnswered}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Right: answered prayers */}
      <section>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-light text-ivory">
            {answered.length > 0
              ? `${answered.length} answered`
              : 'Answered'}
          </h2>
          {answered.length > 0 && (
            <p className="mt-0.5 text-xs text-silver italic">
              Look what he has done.
            </p>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {answered.length === 0 && (
            <motion.div
              key="answered-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-sm border border-dashed border-border-sub p-8 text-center"
            >
              <p className="font-display text-xl font-light text-ivory-dim">
                This is where answered prayers live.
              </p>
              <p className="mt-1 text-sm text-silver">
                When God moves, mark it and remember.
              </p>
            </motion.div>
          )}

          {answered.map((request) => (
            <motion.div
              key={request.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4"
            >
              <AnsweredCard
                request={request}
                onReopen={handleReopen}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
      </div>
    </div>
  );
}

/**
 * Remove control for a prayer card. Deleting a prayer is permanent and there
 * is no undo, so it asks once before doing it. Always visible rather than
 * hover-revealed: an invisible-but-tappable target sitting on the corner of
 * every card is how a phone loses a prayer to a stray thumb.
 */
function DeleteControl({
  onConfirm,
  label,
}: {
  onConfirm: () => void;
  label: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex shrink-0 items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="rounded-sm border border-gold/40 px-2 py-1 uppercase tracking-[0.1em] text-gold transition-colors hover:bg-gold hover:text-black"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-sm border border-border-sub px-2 py-1 uppercase tracking-[0.1em] text-silver transition-colors hover:text-ivory"
        >
          Keep
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="shrink-0 p-1 text-muted transition-colors hover:text-silver"
      aria-label={label}
    >
      <XIcon />
    </button>
  );
}

/* ============================================================
   Add-prayer form
   ============================================================ */

interface AddPrayerFormProps {
  onCancel: () => void;
  onSubmit: (input: { title: string; body: string; category: string }) => void;
  isPending: boolean;
}

function AddPrayerForm({ onCancel, onSubmit, isPending }: AddPrayerFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string>('general');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), body: body.trim(), category });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-sm border border-border-gold bg-black-3 p-5"
    >
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        New request
      </p>

      {/* Real labels, visually hidden: a placeholder disappears the moment
          someone types, so on its own it leaves a screen reader with nothing. */}
      <label htmlFor="prayer-title" className="sr-only">
        What are you bringing to God?
      </label>
      <input
        id="prayer-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What are you bringing to God?"
        autoFocus
        maxLength={200}
        className="mb-3 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      <label htmlFor="prayer-body" className="sr-only">
        More detail, if you want it here. Optional.
      </label>
      <textarea
        id="prayer-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="More detail, if you want it here. (Optional)"
        rows={3}
        maxLength={2000}
        className="mb-3 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      <label htmlFor="prayer-category" className="sr-only">
        Category
      </label>
      <select
        id="prayer-category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mb-4 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
      >
        {PRAYER_CATEGORIES.map((c) => (
          <option key={c} value={c} className="bg-black-2 capitalize">
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="flex-1 rounded-sm bg-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Add prayer'}
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
   Open prayer card
   ============================================================ */

interface OpenCardProps {
  request: PrayerRequest;
  onMarkAnswered: (id: string, note: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

function OpenCard({ request, onMarkAnswered, onShare, onDelete }: OpenCardProps) {
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [answeredNote, setAnsweredNote] = useState('');
  const [justAnswered, setJustAnswered] = useState(false);
  const [, startTransition] = useTransition();

  function submitAnswered() {
    setJustAnswered(true);
    // Brief celebration, then hand off to parent.
    startTransition(() => {
      setTimeout(() => {
        onMarkAnswered(request.id, answeredNote);
      }, 1400);
    });
  }

  if (justAnswered) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-emerald-lt/30 bg-black-3 p-8">
        <SuccessCheck size={56} />
        <p className="font-display text-lg font-light text-ivory">
          Praise him for this.
        </p>
      </div>
    );
  }

  return (
    <article className="group rounded-sm border border-border-sub bg-black-3 p-5 transition-colors hover:border-border-gold">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-light leading-snug text-ivory">
            {request.title}
          </h3>
          {request.body && (
            <p className="mt-1.5 text-sm leading-relaxed text-silver">
              {request.body}
            </p>
          )}
        </div>
        <DeleteControl
          onConfirm={() => onDelete(request.id)}
          label="Remove prayer request"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CategoryBadge category={request.category} />
        <span className="text-[11px] text-muted">
          {timeAgo(request.created_at)}
        </span>
        {request.shared && (
          <span className="rounded-sm border border-gold/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-gold">
            Shared
          </span>
        )}
      </div>

      {showAnswerInput ? (
        <div className="mt-3 border-t border-border-sub pt-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
            How did God answer?
          </p>
          <textarea
            value={answeredNote}
            onChange={(e) => setAnsweredNote(e.target.value)}
            placeholder="Write a note about how he moved. Or leave it blank."
            rows={2}
            maxLength={1000}
            autoFocus
            className="mb-3 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitAnswered}
              className="flex-1 rounded-sm bg-emerald-lt px-3 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-ivory transition-opacity hover:opacity-90"
            >
              Mark as answered
            </button>
            <button
              type="button"
              onClick={() => setShowAnswerInput(false)}
              className="rounded-sm border border-border-sub px-3 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-silver transition-colors hover:text-ivory"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 border-t border-border-sub pt-4">
          <button
            type="button"
            onClick={() => setShowAnswerInput(true)}
            className="rounded-sm border border-emerald-lt/40 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-emerald-bright transition-colors hover:bg-emerald-lt/10"
          >
            Answered
          </button>
          {!request.shared && (
            <button
              type="button"
              onClick={() => onShare(request.id)}
              className="rounded-sm border border-border-sub px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
            >
              Share to wall
            </button>
          )}
        </div>
      )}
    </article>
  );
}

/* ============================================================
   Answered prayer card
   ============================================================ */

interface AnsweredCardProps {
  request: PrayerRequest;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
}

function AnsweredCard({ request, onReopen, onDelete }: AnsweredCardProps) {
  return (
    <article className="group rounded-sm border border-emerald-lt/20 bg-black-3 p-5 transition-colors hover:border-emerald-lt/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-sm border border-emerald-lt/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-bright">
              Answered
            </span>
            {request.answered_at && (
              <span className="text-[11px] text-muted">
                {timeAgo(request.answered_at)}
              </span>
            )}
          </div>
          <h3 className="font-display text-xl font-light leading-snug text-ivory">
            {request.title}
          </h3>
          {request.answered_note && (
            <p className="mt-2 border-l-2 border-emerald-lt/40 pl-3 text-sm italic leading-relaxed text-ivory-dim">
              {request.answered_note}
            </p>
          )}
        </div>
        <DeleteControl
          onConfirm={() => onDelete(request.id)}
          label="Remove this record"
        />
      </div>

      <div className="flex items-center gap-2 border-t border-border-sub pt-4">
        <CategoryBadge category={request.category} />
        <span className="text-[11px] text-muted">
          Added {timeAgo(request.created_at)}
        </span>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onReopen(request.id)}
          className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted transition-colors hover:text-silver"
        >
          Still praying for this
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   Small shared components
   ============================================================ */

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em]',
        'border border-border-sub text-muted',
      )}
    >
      {category}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
