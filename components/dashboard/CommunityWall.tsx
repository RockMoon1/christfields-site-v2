'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  postCommunityPrayer,
  prayForCommunity,
  markCommunityAnswered,
  deleteCommunityPrayer,
  type CommunityPrayerView,
} from '@/app/dashboard/(app)/community/actions';

interface CommunityWallProps {
  initial: CommunityPrayerView[];
  totalPrayed: number;
}

/**
 * Shared prayer wall. Cooperative, not competitive. No likes, no ranking,
 * no comparison. Just people carrying each other's burdens.
 */
export function CommunityWall({ initial, totalPrayed: _totalPrayed }: CommunityWallProps) {
  const [prayers, setPrayers] = useState<CommunityPrayerView[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  /* ---- Post new request ---- */
  function handlePost(title: string, body: string) {
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommunityPrayerView = {
      id: tempId,
      clerk_user_id: '',
      author_name: 'You',
      title,
      body,
      pray_count: 0,
      answered: false,
      created_at: new Date().toISOString(),
      prayedByMe: false,
      mine: true,
    };

    setPrayers((prev) => [optimistic, ...prev]);
    setShowForm(false);

    startTransition(async () => {
      try {
        const real = await postCommunityPrayer({ title, body });
        setPrayers((prev) => prev.map((p) => (p.id === tempId ? real : p)));
      } catch (err) {
        setPrayers((prev) => prev.filter((p) => p.id !== tempId));
        console.error('postCommunityPrayer failed', err);
      }
    });
  }

  /* ---- Pray for a request ---- */
  function handlePray(id: string) {
    setPrayers((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, prayedByMe: true, pray_count: p.pray_count + 1 }
          : p,
      ),
    );

    startTransition(async () => {
      try {
        await prayForCommunity(id);
      } catch (err) {
        // Roll back the optimistic update.
        setPrayers((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, prayedByMe: false, pray_count: Math.max(0, p.pray_count - 1) }
              : p,
          ),
        );
        console.error('prayForCommunity failed', err);
      }
    });
  }

  /* ---- Mark answered ---- */
  function handleAnswered(id: string) {
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, answered: true } : p)),
    );

    startTransition(async () => {
      try {
        await markCommunityAnswered(id);
      } catch (err) {
        setPrayers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, answered: false } : p)),
        );
        console.error('markCommunityAnswered failed', err);
      }
    });
  }

  /* ---- Delete ---- */
  function handleDelete(id: string) {
    const removed = prayers.find((p) => p.id === id);
    setPrayers((prev) => prev.filter((p) => p.id !== id));

    startTransition(async () => {
      try {
        await deleteCommunityPrayer(id);
      } catch (err) {
        if (removed) setPrayers((prev) => [removed, ...prev]);
        console.error('deleteCommunityPrayer failed', err);
      }
    });
  }

  return (
    <div>
      {/* Post new request */}
      <div className="mb-8">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <PostForm
                onCancel={() => setShowForm(false)}
                onSubmit={handlePost}
                isPending={isPending}
              />
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              type="button"
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-3 rounded-sm border border-dashed border-border-sub bg-transparent px-5 py-3.5 text-sm text-silver transition-colors hover:border-border-gold hover:text-ivory"
            >
              <PlusIcon />
              Share a prayer request
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Wall */}
      {prayers.length === 0 ? (
        <EmptyState onShare={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {prayers.map((prayer) => (
              <motion.div
                key={prayer.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <PrayerCard
                  prayer={prayer}
                  onPray={handlePray}
                  onAnswered={handleAnswered}
                  onDelete={handleDelete}
                  isPending={isPending}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Post form
   ============================================================ */

interface PostFormProps {
  onCancel: () => void;
  onSubmit: (title: string, body: string) => void;
  isPending: boolean;
}

function PostForm({ onCancel, onSubmit, isPending }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), body.trim());
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-sm border border-border-gold bg-black-3 p-6"
    >
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        Share a request
      </p>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you bringing before God?"
          autoFocus
          maxLength={120}
          required
          className="rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="A little more context, if you would like to share it. (Optional)"
          rows={3}
          maxLength={600}
          className="rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Your first name will be visible to other members. Share only what you are comfortable with.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="flex-1 rounded-sm bg-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt disabled:opacity-60"
        >
          {isPending ? 'Sharing...' : 'Share request'}
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
   Individual prayer card
   ============================================================ */

interface PrayerCardProps {
  prayer: CommunityPrayerView;
  onPray: (id: string) => void;
  onAnswered: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

function PrayerCard({ prayer, onPray, onAnswered, onDelete, isPending }: PrayerCardProps) {
  const when = formatWhen(prayer.created_at);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-sm border bg-black-3 p-6 transition-colors',
        prayer.answered
          ? 'border-emerald-lt/30'
          : 'border-border-sub hover:border-border-gold',
      )}
    >
      {/* Top shimmer on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">
            {prayer.author_name}
            <span className="ml-2 font-normal normal-case tracking-normal text-muted">
              {when}
            </span>
          </p>
        </div>

        {prayer.answered && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-lt/40 bg-emerald-lt/10 px-3 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-lt">
            <CheckCircleIcon />
            Answered
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-display text-2xl font-light leading-snug text-ivory">
        {prayer.title}
      </h2>

      {/* Body */}
      {prayer.body && (
        <p className="mt-2 text-sm leading-relaxed text-silver">{prayer.body}</p>
      )}

      {/* Answered note */}
      {prayer.answered && (
        <p className="mt-3 border-l-2 border-emerald-lt/40 pl-3 text-sm italic text-ivory-dim">
          Thank you, Lord.
        </p>
      )}

      {/* Actions row */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border-sub pt-4">
        {/* Pray button */}
        {!prayer.answered && (
          <button
            type="button"
            onClick={() => onPray(prayer.id)}
            disabled={prayer.prayedByMe || isPending || prayer.id.startsWith('temp-')}
            className={cn(
              'flex items-center gap-2 rounded-sm border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] transition-colors',
              prayer.prayedByMe
                ? 'cursor-default border-gold/30 bg-gold/8 text-gold-lt'
                : 'border-border-sub text-silver hover:border-gold/40 hover:text-gold',
            )}
            aria-label={
              prayer.prayedByMe
                ? 'You are praying for this'
                : 'I prayed for this'
            }
          >
            {prayer.prayedByMe ? (
              <>
                <HandsPrayIcon checked />
                Praying with you
              </>
            ) : (
              <>
                <HandsPrayIcon />
                I prayed for this
              </>
            )}
          </button>
        )}

        {/* Count */}
        {prayer.pray_count > 0 && (
          <span className="text-[11px] text-muted">
            {prayer.pray_count}{' '}
            {prayer.pray_count === 1 ? 'person praying' : 'praying'}
          </span>
        )}

        {/* Author actions */}
        {prayer.mine && !prayer.answered && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAnswered(prayer.id)}
              disabled={isPending || prayer.id.startsWith('temp-')}
              className="text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-emerald-lt disabled:opacity-50"
            >
              Mark answered
            </button>
            <span className="text-muted" aria-hidden>
              &middot;
            </span>
            <button
              type="button"
              onClick={() => onDelete(prayer.id)}
              disabled={isPending || prayer.id.startsWith('temp-')}
              className="text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-silver disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        )}
        {prayer.mine && prayer.answered && (
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => onDelete(prayer.id)}
              disabled={isPending}
              className="text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-silver disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   Empty state
   ============================================================ */

function EmptyState({ onShare }: { onShare: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-sm border border-dashed border-border-sub bg-black-3/40 px-8 py-16 text-center"
    >
      <p className="font-display text-2xl font-light text-ivory-dim">
        No requests yet.
      </p>
      <p className="mt-2 text-sm text-muted">
        Be the first to share something you are carrying. Others will pray with you.
      </p>
      <button
        type="button"
        onClick={onShare}
        className="mt-6 rounded-sm border border-gold/40 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
      >
        Share a request
      </button>
    </motion.div>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

function formatWhen(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/* ============================================================
   Micro icons
   ============================================================ */

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0">
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5 8l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HandsPrayIcon({ checked }: { checked?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0">
      {checked ? (
        /* Simple filled dove / hands at rest */
        <>
          <path
            d="M8 2.5C6 4 4 5.5 4 8s1.5 4 4 4 4-1.5 4-4-2-4-4-5.5z"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 8.5l1.5 1.5L10 7"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        /* Open hands / prayer gesture */
        <>
          <path
            d="M5 9.5V6a1 1 0 012 0v3m4 0V6a1 1 0 00-2 0v3"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 9.5C3.5 12 5.5 13.5 8 13.5s4.5-1.5 4.5-4V9"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
