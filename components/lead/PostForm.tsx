'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_LIST, isEventType, type EventType } from '@/lib/dashboard/events';
import { defaultMemberNote, defaultLeaderNote } from '@/lib/dashboard/prompts';
import { MAX_SERIES_WEEKS } from '@/lib/schedule/series';
import { createEvent, updateEvent } from '@/app/dashboard/(app)/lead/actions';

export interface PostInitial {
  orgId: string;
  title: string;
  type: string;
  /** Prefill from an existing event (UTC instant) ... */
  startsAtIso?: string | null;
  /** ... or from a best-time card (already in the browser's local wall clock). */
  startsAtLocal?: string;
  endsAtIso?: string | null;
  location: string;
  description: string;
  memberNote: string;
  leaderNote: string;
  weeks: number;
  bringItems: string;
  ridesEnabled: boolean;
  seriesId: string | null;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** An instant as the value a datetime-local input wants, in the browser's zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Denver';
  } catch {
    return 'America/Denver';
  }
}

const inputClass =
  'w-full min-h-[44px] rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-base text-ivory placeholder:text-muted focus:border-gold focus:outline-none [color-scheme:dark]';
const labelClass = 'mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted';

/**
 * One form for posting and for changing. Five visible fields; everything else
 * under More. Post and tell everyone, or save quietly. On edit, "tell everyone"
 * only fans out when the time or place actually changed.
 */
export function PostForm({
  mode,
  eventId,
  orgs,
  initial,
}: {
  mode: 'create' | 'edit';
  eventId?: string;
  orgs: { orgId: string; orgName: string }[];
  initial: PostInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [orgId, setOrgId] = useState(initial.orgId);
  const [title, setTitle] = useState(initial.title);
  const [type, setType] = useState<EventType>(isEventType(initial.type) ? initial.type : 'gathering');
  const [when, setWhen] = useState(initial.startsAtLocal || toLocalInput(initial.startsAtIso));
  const [ends, setEnds] = useState(toLocalInput(initial.endsAtIso));
  const [location, setLocation] = useState(initial.location);
  const [description, setDescription] = useState(initial.description);
  const [memberNote, setMemberNote] = useState(initial.memberNote || (mode === 'create' ? defaultMemberNote(type) : ''));
  const [leaderNote, setLeaderNote] = useState(initial.leaderNote || (mode === 'create' ? defaultLeaderNote(type) : ''));
  const [notesTouched, setNotesTouched] = useState(!!initial.memberNote || !!initial.leaderNote);
  const [weeks, setWeeks] = useState(initial.weeks);
  const [bringItems, setBringItems] = useState(initial.bringItems);
  const [ridesEnabled, setRidesEnabled] = useState(initial.ridesEnabled);
  const [more, setMore] = useState(false);
  const [notify, setNotify] = useState(true);
  const [scope, setScope] = useState<'one' | 'following'>('one');

  const orgName = useMemo(() => orgs.find((o) => o.orgId === orgId)?.orgName ?? '', [orgs, orgId]);

  function pickType(t: EventType) {
    setType(t);
    if (mode === 'create' && !notesTouched) {
      setMemberNote(defaultMemberNote(t));
      setLeaderNote(defaultLeaderNote(t));
    }
  }

  function submit(quietly: boolean) {
    setError('');
    if (!title.trim()) return setError('Give it a name.');
    if (!when) return setError('Pick a day and time.');
    const startsAt = new Date(when);
    if (Number.isNaN(startsAt.getTime())) return setError('That date does not look right.');
    const endsAt = ends ? new Date(ends) : null;

    startTransition(async () => {
      if (mode === 'create') {
        const res = await createEvent({
          orgId,
          title,
          type,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt.toISOString() : null,
          tz: browserTz(),
          location,
          description,
          memberNote,
          leaderNote,
          weeks,
          bringItems: bringItems.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
          ridesEnabled,
          notify: !quietly,
        }).catch(() => ({ ok: false as const, error: 'Something went wrong.' }));
        if (!res.ok) return setError(res.error ?? 'Could not save it.');
        router.push(res.id ? `/dashboard/e/${res.id}` : '/dashboard/lead');
      } else if (eventId) {
        const res = await updateEvent(eventId, {
          title,
          type,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt.toISOString() : null,
          location,
          description,
          memberNote,
          leaderNote,
          ridesEnabled,
          notify,
          scope,
        }).catch(() => ({ ok: false as const, error: 'Something went wrong.' }));
        if (!res.ok) return setError(res.error ?? 'Could not save the change.');
        router.push(`/dashboard/e/${eventId}`);
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="rounded-sm border border-border-sub bg-black-3 p-5 md:p-6"
    >
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">{orgName}</p>

      {orgs.length > 1 && mode === 'create' && (
        <div className="mb-4 flex flex-wrap gap-2">
          {orgs.map((o) => (
            <button
              key={o.orgId}
              type="button"
              onClick={() => setOrgId(o.orgId)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs',
                o.orgId === orgId ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
              )}
            >
              {o.orgName}
            </button>
          ))}
        </div>
      )}

      <label className={labelClass} htmlFor="post-title">
        What
      </label>
      <input
        id="post-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Rock climbing"
        maxLength={120}
        className={cn(inputClass, 'mb-4')}
      />

      <p className={labelClass}>Kind</p>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {EVENT_TYPE_LIST.map((t) => {
          const active = type === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => pickType(t.key)}
              aria-pressed={active}
              className={cn(
                'min-h-[44px] rounded-sm border px-3 text-sm transition-colors',
                active ? 'text-ivory' : 'border-border-sub text-silver hover:border-border-gold',
              )}
              style={active ? { borderColor: t.accent, backgroundColor: `${t.accent}1a` } : undefined}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="post-when">
            When
          </label>
          <input id="post-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="post-where">
            Where
          </label>
          <input
            id="post-where"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address or place"
            maxLength={160}
            className={inputClass}
          />
        </div>
      </div>

      <label className={labelClass} htmlFor="post-line">
        One line for people
      </label>
      <input
        id="post-line"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What to expect, what to bring, who it is for."
        maxLength={600}
        className={cn(inputClass, 'mb-4')}
      />

      <button
        type="button"
        onClick={() => setMore((v) => !v)}
        aria-expanded={more}
        className="mb-4 inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:text-gold-lt"
      >
        {more ? 'Less' : 'More'} {more ? '↑' : '↓'}
      </button>

      {more && (
        <div className="mb-4 space-y-4 rounded-sm border border-border-sub bg-black-2 p-4">
          <div>
            <label className={labelClass} htmlFor="post-ends">
              Ends (optional)
            </label>
            <input id="post-ends" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} className={inputClass} />
          </div>

          {mode === 'create' && (
            <div>
              <p className={labelClass}>Repeat weekly</p>
              <div className="flex flex-wrap gap-2">
                {[1, 4, 6, 8, 12].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setWeeks(n)}
                    aria-pressed={weeks === n}
                    className={cn(
                      'min-h-[44px] rounded-sm border px-3 text-sm',
                      weeks === n ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
                    )}
                  >
                    {n === 1 ? 'Once' : `${n} weeks`}
                  </button>
                ))}
              </div>
              {weeks > 1 && <p className="mt-1 text-xs text-muted">Up to {MAX_SERIES_WEEKS} weeks. You can extend it later.</p>}
            </div>
          )}

          {mode === 'edit' && initial.seriesId && (
            <div>
              <p className={labelClass}>This repeats</p>
              <div className="flex gap-2">
                {(['one', 'following'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    aria-pressed={scope === s}
                    className={cn(
                      'min-h-[44px] rounded-sm border px-3 text-sm',
                      scope === s ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
                    )}
                  >
                    {s === 'one' ? 'Just this one' : 'This and the following ones'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="post-member-note">
              Two things people could ask each other
            </label>
            <textarea
              id="post-member-note"
              value={memberNote}
              onChange={(e) => {
                setMemberNote(e.target.value);
                setNotesTouched(true);
              }}
              rows={2}
              maxLength={400}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="post-leader-note">
              Questions that might come up (only you see this)
            </label>
            <textarea
              id="post-leader-note"
              value={leaderNote}
              onChange={(e) => {
                setLeaderNote(e.target.value);
                setNotesTouched(true);
              }}
              rows={3}
              maxLength={400}
              className={inputClass}
            />
          </div>

          {mode === 'create' && (
            <div>
              <label className={labelClass} htmlFor="post-bring">
                Bring something (one per line)
              </label>
              <textarea
                id="post-bring"
                value={bringItems}
                onChange={(e) => setBringItems(e.target.value)}
                rows={2}
                placeholder={'Salad\nDrinks\nDessert'}
                className={inputClass}
              />
            </div>
          )}

          <label className="flex min-h-[44px] items-center gap-3 text-sm text-silver">
            <input type="checkbox" checked={ridesEnabled} onChange={(e) => setRidesEnabled(e.target.checked)} className="h-5 w-5 accent-[#c9a548]" />
            Let people offer and ask for rides
          </label>

          {mode === 'edit' && (
            <label className="flex min-h-[44px] items-center gap-3 text-sm text-silver">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-5 w-5 accent-[#c9a548]" />
              Tell everyone about this change (only if the time or place moved)
            </label>
          )}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[48px] items-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt disabled:opacity-60"
        >
          {pending ? 'Saving…' : mode === 'create' ? 'Post and tell everyone' : 'Save'}
        </button>
        {mode === 'create' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(true)}
            className="inline-flex min-h-[48px] items-center rounded-sm border border-border-sub px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-silver hover:text-ivory disabled:opacity-60"
          >
            Save quietly
          </button>
        )}
      </div>
    </form>
  );
}
