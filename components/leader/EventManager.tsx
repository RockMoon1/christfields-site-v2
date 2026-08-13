'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_LIST, eventTheme, formatEventWhen, eventCountdown } from '@/lib/dashboard/events';
import {
  createEvent,
  deleteEvent,
  type LeaderEvent,
} from '@/app/dashboard/(leader)/leader/events/actions';

/**
 * Leader tool to create events and see who is coming. The type picker
 * sets the banner's animated theme on every member's dashboard. The list reads
 * from the server (refreshed after each change) so RSVP counts stay accurate.
 */
export function EventManager({
  initialEvents,
  orgName,
}: {
  initialEvents: LeaderEvent[];
  orgName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [type, setType] = useState(EVENT_TYPE_LIST[0].key as string);
  const [when, setWhen] = useState(''); // datetime-local value (local time)
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const selectedTheme = eventTheme(type);

  function resetForm() {
    setTitle('');
    setType(EVENT_TYPE_LIST[0].key);
    setWhen('');
    setLocation('');
    setDescription('');
    setError('');
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Give the event a name.');
      return;
    }
    if (!when) {
      setError('Pick a date and time.');
      return;
    }
    // datetime-local is naive local time; convert to a real UTC ISO here on the
    // client so the server stores the moment the leader actually meant.
    const startsAt = new Date(when);
    if (Number.isNaN(startsAt.getTime())) {
      setError('That date does not look right.');
      return;
    }

    startTransition(async () => {
      const res = await createEvent({
        title,
        description,
        type,
        location,
        startsAt: startsAt.toISOString(),
      }).catch(() => ({ ok: false, error: 'Something went wrong. Please try again.' }));

      if (res.ok) {
        resetForm();
        router.refresh();
      } else {
        setError(res.error ?? 'Could not save the event.');
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEvent(id).catch(() => ({ ok: false }));
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="h-fit rounded-md border border-border-sub bg-black-3/70 p-6"
      >
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          New event
        </p>
        <p className="mb-5 text-sm text-silver">
          This shows up as an animated banner on every member's dashboard in {orgName}.
        </p>

        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          Name
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Friday Night Worship"
          maxLength={120}
          className="mb-4 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />

        {/* Type picker */}
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          Type (sets the banner&rsquo;s look)
        </label>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EVENT_TYPE_LIST.map((t) => {
            const active = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-sm border px-3 py-2 text-left transition-colors',
                  active ? 'text-ivory' : 'border-border-sub text-silver hover:border-border-gold',
                )}
                style={active ? { borderColor: t.accent, backgroundColor: `${t.accent}1a` } : undefined}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.accent, boxShadow: `0 0 6px ${t.accent}` }}
                  />
                  {t.label}
                </span>
                <span className="text-[10px] leading-tight text-muted">{t.tagline}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              When
            </label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              Where (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address or place"
              maxLength={160}
              className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          Details (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What to expect, what to bring, who it is for."
          rows={3}
          maxLength={600}
          className="mb-4 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: selectedTheme.accent }}
        >
          {pending ? 'Saving...' : 'Create event'}
        </button>
      </form>

      {/* Existing events */}
      <div>
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Upcoming &amp; recent
        </p>
        {initialEvents.length === 0 ? (
          <div className="rounded-md border border-dashed border-border-sub p-8 text-center text-sm text-silver">
            No events yet. Create one and it lights up everyone&rsquo;s dashboard.
          </div>
        ) : (
          <ul className="space-y-3">
            {initialEvents.map((ev) => {
              const t = eventTheme(ev.type);
              return (
                <motion.li
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-md border border-border-sub bg-black-3 p-4 pl-5"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: t.accent, boxShadow: `0 0 10px ${t.accent}66` }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em]"
                          style={{ color: t.accent, backgroundColor: `${t.accent}1a` }}
                        >
                          {t.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                          {eventCountdown(ev.startsAt)}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-light text-ivory">{ev.title}</h3>
                      <p className="mt-0.5 text-xs text-silver" suppressHydrationWarning>
                        {formatEventWhen(ev.startsAt, ev.endsAt)}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(ev.id)}
                      disabled={pending}
                      className="shrink-0 rounded-full p-2 text-muted transition-colors hover:bg-black-2 hover:text-silver disabled:opacity-50"
                      aria-label={`Delete ${ev.title}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-border-sub/60 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-bright">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-bright" />
                      {ev.goingCount} going
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                      {ev.notGoingCount} can&rsquo;t
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M3 4.5h10M6.5 4.5V3.5a1 1 0 011-1h1a1 1 0 011 1v1M5 4.5l.5 8a1 1 0 001 .9h3a1 1 0 001-.9l.5-8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
