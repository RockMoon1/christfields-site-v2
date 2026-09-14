'use client';

import { useEffect, useRef, useState, useTransition, type RefCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Notice } from '@/components/ui/Notice';
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
  // Keep the draft outside PostForm: optimistic submission unmounts the form.
  const [draft, setDraft] = useState({ title: '', body: '' });
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const focusTargets = useRef(new Map<string, HTMLElement>());
  const opener = useRef('share');
  const focusRequest = useRef<{ key: string; onlyIfUnclaimed: boolean } | null>(null);
  const registerFocus = (key: string): RefCallback<HTMLElement> => (node) => {
    if (node) focusTargets.current.set(key, node);
    else focusTargets.current.delete(key);
  };

  // Optimistic updates can remove or disable the active control. Recover only
  // after the final DOM commits; never pull someone back from another control.
  useEffect(() => {
    if (isPending || !focusRequest.current) return;
    const { key, onlyIfUnclaimed } = focusRequest.current;
    focusRequest.current = null;
    const active = document.activeElement;
    if (!onlyIfUnclaimed || !active || active === document.body || active === document.documentElement) {
      focusTargets.current.get(key)?.focus();
    }
  }, [isPending, showForm, prayers]);

  function openForm(from: string) {
    opener.current = from;
    if (showForm) {
      focusTargets.current.get('title')?.focus();
      return;
    }
    focusRequest.current = { key: 'title', onlyIfUnclaimed: false };
    setShowForm(true);
  }

  function cancelForm() {
    focusRequest.current = { key: opener.current, onlyIfUnclaimed: false };
    setShowForm(false);
  }

  /* ---- Post new request ---- */
  function handlePost(title: string, body: string) {
    if (isPending) return;
    setNotice(null);
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommunityPrayerView = {
      id: tempId,
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
        focusRequest.current = { key: `heading:${real.id}`, onlyIfUnclaimed: true };
        setPrayers((prev) => prev.map((p) => (p.id === tempId ? real : p)));
        setDraft({ title: '', body: '' });
      } catch {
        focusRequest.current = { key: 'title', onlyIfUnclaimed: true };
        setPrayers((prev) => prev.filter((p) => p.id !== tempId));
        setShowForm(true);
        setNotice('Could not share your request. Your words are still here. Please try again.');
      }
    });
  }

  /* ---- Pray for a request ---- */
  function handlePray(id: string) {
    if (isPending) return;
    setNotice(null);
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
        focusRequest.current = { key: `heading:${id}`, onlyIfUnclaimed: true };
      } catch {
        focusRequest.current = { key: `pray:${id}`, onlyIfUnclaimed: true };
        // Roll back the optimistic update.
        setPrayers((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, prayedByMe: false, pray_count: Math.max(0, p.pray_count - 1) }
              : p,
          ),
        );
        setNotice('Could not save that you are praying. Please try again.');
      }
    });
  }

  /* ---- Mark answered ---- */
  function handleAnswered(id: string) {
    if (isPending) return;
    setNotice(null);
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, answered: true } : p)),
    );

    startTransition(async () => {
      try {
        await markCommunityAnswered(id);
        focusRequest.current = { key: `remove:${id}`, onlyIfUnclaimed: true };
      } catch {
        focusRequest.current = { key: `answered:${id}`, onlyIfUnclaimed: true };
        setPrayers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, answered: false } : p)),
        );
        setNotice('Could not mark this request as answered. It is still on the wall. Please try again.');
      }
    });
  }

  /* ---- Delete ---- */
  function handleDelete(id: string) {
    if (isPending) return;
    setNotice(null);
    const removed = prayers.find((p) => p.id === id);
    const index = prayers.findIndex((p) => p.id === id);
    const neighbour = prayers[index + 1] ?? prayers[index - 1];
    setPrayers((prev) => prev.filter((p) => p.id !== id));

    startTransition(async () => {
      try {
        await deleteCommunityPrayer(id);
        focusRequest.current = { key: neighbour ? `heading:${neighbour.id}` : 'share', onlyIfUnclaimed: true };
      } catch {
        focusRequest.current = { key: `remove:${id}`, onlyIfUnclaimed: true };
        if (removed) setPrayers((prev) => [removed, ...prev]);
        setNotice('Could not remove this request. It has been restored to the wall. Please try again.');
      }
    });
  }

  return (
    <div data-prayer-wall>
      <Notice message={notice} />
      {/* Post new request */}
      <div className="mb-8">
        {showForm ? (
          <PostForm
            onCancel={cancelForm}
            onSubmit={handlePost}
            isPending={isPending}
            draft={draft}
            onDraftChange={setDraft}
            titleRef={registerFocus('title')}
          />
        ) : (
          <button
            ref={registerFocus('share')}
            type="button"
            disabled={isPending}
            onClick={() => openForm('share')}
            className="flex min-h-11 items-center gap-3 rounded-sm border border-dashed border-border-sub bg-transparent px-5 py-3.5 text-sm text-silver transition-colors duration-200 hover:border-border-gold hover:text-ivory focus-visible:border-border-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon />
            Share a prayer request
          </button>
        )}
      </div>

      {/* Wall */}
      {prayers.length === 0 ? (
        <EmptyState onShare={() => openForm('empty-share')} isPending={isPending} shareRef={registerFocus('empty-share')} />
      ) : (
        <div className="flex flex-col gap-5">
          {prayers.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              onPray={handlePray}
              onAnswered={handleAnswered}
              onDelete={handleDelete}
              isPending={isPending}
              registerFocus={registerFocus}
            />
          ))}
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
  draft: { title: string; body: string };
  onDraftChange: (draft: { title: string; body: string }) => void;
  titleRef: RefCallback<HTMLElement>;
}

function PostForm({ onCancel, onSubmit, isPending, draft, onDraftChange, titleRef }: PostFormProps) {
  const { title, body } = draft;

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
      <p className="mb-4 text-meta font-medium uppercase tracking-[0.2em] text-gold">
        Share a request
      </p>

      <div className="flex flex-col gap-3">
        <Field id="prayer-request-title" label="Prayer request">
          <Input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => onDraftChange({ ...draft, title: e.target.value })}
            placeholder="What are you bringing before God?"
            maxLength={120}
            required
          />
        </Field>
        <Field id="prayer-request-body" label="More context (optional)">
          <Textarea
            value={body}
            onChange={(e) => onDraftChange({ ...draft, body: e.target.value })}
            placeholder="A little more context, if you would like to share it. (Optional)"
            rows={3}
            maxLength={600}
          />
        </Field>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-silver">
        Your first name will be visible to other members. Share only what you are comfortable with.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button fx={false} size="sm"
          type="submit"
          disabled={!title.trim()}
          pending={isPending}
          pendingLabel="Sharing..."
          className="flex-1"
        >
          Share request
        </Button>
        <Button fx={false} variant="quiet" size="sm"
          type="button"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
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
  registerFocus: (key: string) => RefCallback<HTMLElement>;
}

function PrayerCard({ prayer, onPray, onAnswered, onDelete, isPending, registerFocus }: PrayerCardProps) {
  const when = formatWhen(prayer.created_at);

  return (
    <article
      className={cn(
        'relative rounded-sm border bg-black-3 p-6 transition-colors duration-200 focus-within:border-border-gold',
        prayer.answered
          ? 'border-emerald-lt/30'
          : 'border-border-sub hover:border-border-gold',
      )}
    >
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-meta font-medium uppercase tracking-[0.16em] text-silver [overflow-wrap:anywhere]">
            {prayer.author_name}
            <span className="ml-2 font-normal normal-case tracking-normal text-muted">
              {when}
            </span>
          </p>
        </div>

        {prayer.answered && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-lt/40 bg-emerald-lt/10 px-3 py-0.5 text-sm font-medium text-emerald-bright">
            <CheckCircleIcon />
            Answered
          </span>
        )}
      </div>

      {/* Title */}
      <h2 ref={registerFocus(`heading:${prayer.id}`)} tabIndex={-1} className="font-display text-2xl font-light leading-snug text-ivory [overflow-wrap:anywhere]">
        {prayer.title}
      </h2>

      {/* Body */}
      {prayer.body && (
        <p className="mt-2 text-sm leading-relaxed text-silver [overflow-wrap:anywhere]">{prayer.body}</p>
      )}

      {/* Answered note */}
      {prayer.answered && (
        <p className="mt-3 border-l-2 border-emerald-lt/40 pl-3 text-sm italic text-ivory-dim">
          Thank you, Lord.
        </p>
      )}

      {/* Actions row */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border-sub pt-4">
        {/* Pray button. Not shown on your own request: praying for yourself
            here would inflate your own count and the community-wide total. */}
        {!prayer.answered && !prayer.mine && (
          <Button fx={false} variant="quiet" size="sm"
            ref={registerFocus(`pray:${prayer.id}`)}
            type="button"
            onClick={() => onPray(prayer.id)}
            disabled={prayer.prayedByMe || isPending || prayer.id.startsWith('temp-')}
            className={cn(
              prayer.prayedByMe
                ? 'cursor-default border-gold/30 bg-gold/8 text-gold-lt opacity-100'
                : 'text-silver hover:text-gold',
            )}
            aria-label={
              prayer.prayedByMe
                ? 'You are praying with them'
                : 'Pray with them'
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
                Pray with them
              </>
            )}
          </Button>
        )}

        {/* Count */}
        {prayer.pray_count > 0 && (
          <span className="text-sm text-muted">
            {prayer.pray_count}{' '}
            {prayer.pray_count === 1 ? 'person praying' : 'praying'}
          </span>
        )}

        {/* Author actions */}
        {prayer.mine && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!prayer.answered && <Button fx={false} variant="quiet" size="sm"
              ref={registerFocus(`answered:${prayer.id}`)}
              type="button"
              onClick={() => onAnswered(prayer.id)}
              disabled={isPending || prayer.id.startsWith('temp-')}
            >
              Mark answered
            </Button>}
            <Button fx={false} variant="danger" size="sm"
              ref={registerFocus(`remove:${prayer.id}`)}
              type="button"
              onClick={() => onDelete(prayer.id)}
              disabled={isPending || prayer.id.startsWith('temp-')}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   Empty state
   ============================================================ */

function EmptyState({ onShare, isPending, shareRef }: { onShare: () => void; isPending: boolean; shareRef: RefCallback<HTMLElement> }) {
  return (
    <div
      className="rounded-sm border border-dashed border-border-sub bg-black-3/40 px-8 py-16 text-center"
    >
      <p className="font-display text-2xl font-light text-ivory-dim">
        No requests yet.
      </p>
      <p className="mt-2 text-sm text-muted">
        Be the first to share something you are carrying. Others will pray with you.
      </p>
      <Button fx={false} variant="ghost" size="sm"
        ref={shareRef}
        type="button"
        onClick={onShare}
        disabled={isPending}
        className="mt-6"
      >
        Share a request
      </Button>
    </div>
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
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0">
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
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0">
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
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0">
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
