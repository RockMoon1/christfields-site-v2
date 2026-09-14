'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Notice } from '@/components/ui/Notice';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_LIST, isEventType, type EventType } from '@/lib/dashboard/events';
import { defaultMemberNote, defaultLeaderNote } from '@/lib/dashboard/prompts';
import { bibleUrl, cleanReference } from '@/lib/dashboard/bible';
import { MAX_SERIES_WEEKS } from '@/lib/schedule/series';
import type { GroupAvailability } from '@/lib/schedule/group-availability';
import { createEvent, updateEvent, getOrgAvailability } from '@/app/dashboard/(app)/lead/actions';
import { WhoIsFree, type UpcomingLite } from './WhoIsFree';

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
  scriptureRef?: string;
  scriptureText?: string;
  scriptureWhy?: string;
  discussion?: string;
  contextNotes?: string;
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

const labelClass = 'mb-2 block text-sm font-medium leading-relaxed text-silver';
const choiceClass = 'min-h-11 min-w-0 rounded-sm border px-3 py-2 text-sm leading-relaxed transition-colors duration-200 hover:border-border-gold focus-visible:border-border-gold disabled:cursor-not-allowed disabled:opacity-50';

/**
 * One form for posting and for changing. Five visible fields; everything else
 * under More, including the optional Scripture for the gathering. Under When,
 * who is free then. Post and tell everyone, or save quietly. On edit, "tell
 * everyone" only fans out when the time or place actually changed.
 */
export function PostForm({
  mode,
  eventId,
  orgs,
  initial,
  availability: initialAvailability = null,
  upcoming: initialUpcoming = [],
}: {
  mode: 'create' | 'edit';
  eventId?: string;
  orgs: { orgId: string; orgName: string }[];
  initial: PostInitial;
  availability?: GroupAvailability | null;
  upcoming?: UpcomingLite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [invalidId, setInvalidId] = useState<string | null>(null);
  const [savingQuietly, setSavingQuietly] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inFlight = useRef(false);
  const focusAfterRender = useRef<HTMLElement | string | null>(null);

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
  const [scriptureRef, setScriptureRef] = useState(initial.scriptureRef ?? '');
  const [scriptureText, setScriptureText] = useState(initial.scriptureText ?? '');
  const [scriptureWhy, setScriptureWhy] = useState(initial.scriptureWhy ?? '');
  const [discussion, setDiscussion] = useState(initial.discussion ?? '');
  const [contextNotes, setContextNotes] = useState(initial.contextNotes ?? '');
  const hasScripture = !!(scriptureRef || scriptureText || scriptureWhy || discussion || contextNotes);
  const [more, setMore] = useState(hasScripture);
  const [word, setWord] = useState(hasScripture);
  const [notify, setNotify] = useState(true);
  const [scope, setScope] = useState<'one' | 'following'>('one');

  // Who is free: comes with the page for the first org; fetched again when a leader switches groups.
  const [availability, setAvailability] = useState<GroupAvailability | null>(initialAvailability);
  const [upcoming, setUpcoming] = useState<UpcomingLite[]>(initialUpcoming);
  const [availabilityOrg, setAvailabilityOrg] = useState<string | null>(initialAvailability ? initial.orgId : null);
  const [availabilityStatus, setAvailabilityStatus] = useState<'ready' | 'loading' | 'error'>(initialAvailability ? 'ready' : 'loading');
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const retryButton = useRef<HTMLButtonElement>(null);
  const restoreRetryFocus = useRef(false);
  // Only a successful response is cached. Cleanup distinguishes A→B→A requests.
  const loadedFor = useRef<string | null>(initialAvailability ? initial.orgId : null);
  useEffect(() => {
    if (orgId === loadedFor.current) return;
    let active = true;
    loadedFor.current = null;
    setAvailabilityOrg(null);
    setAvailability(null);
    setUpcoming([]);
    setAvailabilityStatus('loading');
    const target = orgId;
    getOrgAvailability(target)
      .then((r) => {
        if (!active) return;
        if (!r) { setAvailabilityStatus('error'); return; }
        loadedFor.current = target;
        setAvailabilityOrg(target);
        setAvailability(r.availability);
        setUpcoming(r.upcoming);
        setAvailabilityStatus('ready');
      })
      .catch(() => { if (active) setAvailabilityStatus('error'); });
    return () => { active = false; };
  }, [orgId, availabilityRetry]);

  useEffect(() => {
    if (availabilityStatus === 'loading' || !restoreRetryFocus.current) return;
    restoreRetryFocus.current = false;
    if (pending || (document.activeElement !== document.body && document.activeElement !== retryButton.current)) return;
    if (availabilityStatus === 'error') retryButton.current?.focus();
    else formRef.current?.querySelector<HTMLInputElement>('#post-when')?.focus();
  }, [availabilityStatus, pending]);

  useEffect(() => {
    if (pending || !focusAfterRender.current) return;
    const target = focusAfterRender.current;
    focusAfterRender.current = null;
    const element = typeof target === 'string' ? formRef.current?.querySelector<HTMLElement>(`#${target}`) : target;
    element?.focus();
  }, [error, invalidId, more, word, pending]);

  const orgName = useMemo(() => orgs.find((o) => o.orgId === orgId)?.orgName ?? '', [orgs, orgId]);
  const cleanRef = cleanReference(scriptureRef);
  const wordExpanded = more && word;
  const availabilityMessage = availabilityStatus === 'error'
    ? 'We could not check who is free. You can still save this gathering.'
    : availabilityOrg !== orgId || availabilityStatus === 'loading' ? 'Checking who is free…' : '';

  function invalid(id: string, message: string) {
    setError(message);
    setInvalidId(id);
    if (id === 'post-scripture-ref') { setMore(true); setWord(true); }
    if (id === 'post-ends') setMore(true);
    const field = formRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (field) field.focus();
    else focusAfterRender.current = id;
  }

  function validation(id: string) {
    return { 'aria-invalid': invalidId === id || undefined, 'aria-describedby': invalidId === id ? 'post-error' : undefined };
  }

  function pickType(t: EventType) {
    setType(t);
    if (mode === 'create' && !notesTouched) {
      setMemberNote(defaultMemberNote(t));
      setLeaderNote(defaultLeaderNote(t));
    }
  }

  function submit(quietly: boolean) {
    if (inFlight.current || pending) return;
    setError('');
    setInvalidId(null);
    if (!title.trim()) return invalid('post-title', 'Give it a name.');
    if (!when) return invalid('post-when', 'Pick a day and time.');
    const startsAt = new Date(when);
    if (Number.isNaN(startsAt.getTime())) return invalid('post-when', 'That date does not look right.');
    if (scriptureRef.trim() && !cleanRef) return invalid('post-scripture-ref', 'Write the passage like "Romans 12:1-2".');
    if (formRef.current?.querySelector<HTMLInputElement>('#post-ends')?.validity.badInput) return invalid('post-ends', 'That end date does not look right.');
    const endsAt = ends ? new Date(ends) : null;
    if (endsAt && Number.isNaN(endsAt.getTime())) return invalid('post-ends', 'That end date does not look right.');
    if (endsAt && endsAt <= startsAt) return invalid('post-ends', 'Choose an end time after the start.');
    if (mode === 'edit' && !eventId) return setError('This gathering could not be identified. Open it again from Lead.');
    const scripture = {
      scriptureRef: cleanRef,
      scriptureText,
      scriptureWhy,
      discussion,
      contextNotes,
    };

    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    function saveFailed(detail?: string) {
      // A notification can fail after persistence. Never imply nothing saved,
      // and never retry automatically (creating a second event is possible).
      setError(`We could not confirm the save.${detail ? ` ${detail}` : ''} Your entries are still here. Check the gathering in Lead before trying again.`);
      if (origin && (document.activeElement === document.body || document.activeElement === origin)) focusAfterRender.current = origin;
    }
    inFlight.current = true;
    setSavingQuietly(quietly);
    startTransition(async () => {
      try {
        if (mode === 'create') {
          const res = await createEvent({
            orgId,
            title,
            type,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt?.toISOString() ?? null,
            tz: browserTz(),
            location,
            description,
            memberNote,
            leaderNote,
            weeks,
            bringItems: bringItems.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
            ridesEnabled,
            notify: !quietly,
            ...scripture,
          });
          if (!res.ok) return saveFailed(res.error);
          router.push(res.id ? `/dashboard/e/${res.id}` : '/dashboard/lead');
        } else if (eventId) {
          const res = await updateEvent(eventId, {
            title,
            type,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt?.toISOString() ?? null,
            location,
            description,
            memberNote,
            leaderNote,
            ridesEnabled,
            notify,
            scope,
            ...scripture,
          });
          if (!res.ok) return saveFailed(res.error);
          router.push(`/dashboard/e/${eventId}`);
        }
        router.refresh();
      } catch {
        // Only an explicit service result is suitable for display; transport
        // exceptions can contain implementation details.
        saveFailed();
      } finally {
        inFlight.current = false;
      }
    });
  }

  return (
    <form
      ref={formRef}
      noValidate
      aria-busy={pending || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="min-w-0 rounded-sm border border-border-sub bg-black-3 p-5 md:p-6"
    >
      <fieldset disabled={pending} className="min-w-0">
        <legend className="sr-only">{mode === 'create' ? 'Post a gathering' : 'Change a gathering'}</legend>
        <p className="mb-5 break-words text-meta font-medium uppercase tracking-[0.2em] text-gold">{orgName}</p>

        {orgs.length > 1 && mode === 'create' && (
          <div role="group" aria-label="Group" className="mb-5 flex flex-wrap gap-2">
            {orgs.map((o) => (
              <button
                key={o.orgId}
                type="button"
                onClick={() => setOrgId(o.orgId)}
                aria-pressed={o.orgId === orgId}
                className={cn(
                  choiceClass, 'max-w-full break-words text-left',
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
        <Input
          id="post-title" {...validation('post-title')}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rock climbing"
          maxLength={120}
          className="mb-5"
        />

        <p className={labelClass}>Kind</p>
        <div role="group" aria-label="Kind" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {EVENT_TYPE_LIST.map((t) => {
            const active = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => pickType(t.key)}
                aria-pressed={active}
                className={cn(
                  choiceClass,
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
            <Input id="post-when" {...validation('post-when')} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="post-where">
              Where
            </label>
            <Input
              id="post-where"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address or place"
              maxLength={160}

            />
          </div>
        </div>

        <div className="-mt-2 mb-4">
          <Notice tone="info" message={availabilityMessage} />
          {(availabilityStatus === 'error' || (availabilityStatus === 'loading' && availabilityRetry > 0)) && <Button
            ref={retryButton}
            fx={false}
            variant="quiet"
            size="sm"
            className="mt-2"
            pending={availabilityStatus === 'loading'}
            pendingLabel="Checking…"
            onClick={(event) => {
              restoreRetryFocus.current = document.activeElement === event.currentTarget;
              setAvailabilityRetry(v => v + 1);
            }}
          >Try again</Button>}
          <WhoIsFree when={when} availability={availabilityOrg === orgId ? availability : null} upcoming={upcoming} onPick={setWhen} disabled={pending} />
        </div>

        <label className={labelClass} htmlFor="post-line">
          One line for people
        </label>
        <Input
          id="post-line"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What to expect, what to bring, who it is for."
          maxLength={600}
          className="mb-5"
        />

        <div className="mb-4 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
            aria-controls="post-more"
            className="inline-flex min-h-11 items-center text-sm font-medium text-gold transition-colors duration-200 hover:text-gold-lt disabled:opacity-50"
          >
            {more ? 'Less' : 'More'} {more ? '↑' : '↓'}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !wordExpanded;
              setWord(next);
              if (next) setMore(true);
            }}
            aria-expanded={wordExpanded}
            aria-controls="post-word"
            className="inline-flex min-h-11 items-center text-sm font-medium text-gold transition-colors duration-200 hover:text-gold-lt disabled:opacity-50"
          >
            From the Word {wordExpanded ? '↑' : '↓'}
          </button>
        </div>

        {more && (
          <div id="post-more" className="mb-5 space-y-5 border-t border-border-sub pt-5">
            <div>
              <label className={labelClass} htmlFor="post-ends">
                Ends (optional)
              </label>
              <Input id="post-ends" {...validation('post-ends')} type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
            </div>

            {mode === 'create' && (
              <div>
                <p className={labelClass}>Repeat weekly</p>
                <div role="group" aria-label="Repeat weekly" className="flex flex-wrap gap-2">
                  {[1, 4, 6, 8, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setWeeks(n)}
                      aria-pressed={weeks === n}
                      className={cn(
                        choiceClass,
                        weeks === n ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
                      )}
                    >
                      {n === 1 ? 'Once' : `${n} weeks`}
                    </button>
                  ))}
                </div>
                {weeks > 1 && <p className="mt-2 text-sm leading-relaxed text-muted">Up to {MAX_SERIES_WEEKS} weeks. You can extend it later.</p>}
              </div>
            )}

            {mode === 'edit' && initial.seriesId && (
              <div>
                <p className={labelClass}>This repeats</p>
                <div role="group" aria-label="This repeats" className="flex flex-wrap gap-2">
                  {(['one', 'following'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScope(s)}
                      aria-pressed={scope === s}
                      className={cn(
                        choiceClass,
                        scope === s ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
                      )}
                    >
                      {s === 'one' ? 'Just this one' : 'This and the following ones'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {word && (
              <div id="post-word" className="space-y-5 border-l border-border-gold pl-4 sm:pl-5">
                <p className="text-meta font-medium uppercase tracking-[0.2em] text-gold">From the Word (optional)</p>
                <div>
                  <label className={labelClass} htmlFor="post-scripture-ref">
                    Passage
                  </label>
                  <Input
                    id="post-scripture-ref" {...validation('post-scripture-ref')}
                    type="text"
                    value={scriptureRef}
                    onChange={(e) => setScriptureRef(e.target.value)}
                    placeholder="e.g. Romans 12:1-2"
                    maxLength={60}

                  />
                  {cleanRef && (
                    <a
                      href={bibleUrl(cleanRef)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center text-sm font-medium leading-relaxed text-gold transition-colors duration-200 hover:text-gold-lt"
                    >
                      Check it on BibleGateway &rarr;
                    </a>
                  )}
                </div>
                <div>
                  <label className={labelClass} htmlFor="post-scripture-text">
                    The words (paste them if you want people to read them here)
                  </label>
                  <Textarea
                    id="post-scripture-text"
                    value={scriptureText}
                    onChange={(e) => setScriptureText(e.target.value)}
                    rows={3}
                    maxLength={900}

                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="post-scripture-why">
                    Why this passage, in one line
                  </label>
                  <Input
                    id="post-scripture-why"
                    type="text"
                    value={scriptureWhy}
                    onChange={(e) => setScriptureWhy(e.target.value)}
                    maxLength={200}
                    placeholder="What we are hoping to see in it together."

                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="post-discussion">
                    Questions for the group (up to three, one per line)
                  </label>
                  <Textarea
                    id="post-discussion"
                    value={discussion}
                    onChange={(e) => setDiscussion(e.target.value)}
                    rows={3}
                    maxLength={400}
                    placeholder={'What stands out?\nWhere is this hard to live?\nWhat would change if we believed it?'}

                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="post-context">
                    Context for you (history, who wrote it and why; only leaders see this)
                  </label>
                  <Textarea
                    id="post-context"
                    value={contextNotes}
                    onChange={(e) => setContextNotes(e.target.value)}
                    rows={3}
                    maxLength={900}

                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="post-member-note">
                Two things people could ask each other
              </label>
              <Textarea
                id="post-member-note"
                value={memberNote}
                onChange={(e) => {
                  setMemberNote(e.target.value);
                  setNotesTouched(true);
                }}
                rows={2}
                maxLength={400}

              />
            </div>
            <div>
              <label className={labelClass} htmlFor="post-leader-note">
                Questions that might come up (only you see this)
              </label>
              <Textarea
                id="post-leader-note"
                value={leaderNote}
                onChange={(e) => {
                  setLeaderNote(e.target.value);
                  setNotesTouched(true);
                }}
                rows={3}
                maxLength={400}

              />
            </div>

            {mode === 'create' && (
              <div>
                <label className={labelClass} htmlFor="post-bring">
                  Bring something (one per line)
                </label>
                <Textarea
                  id="post-bring"
                  value={bringItems}
                  onChange={(e) => setBringItems(e.target.value)}
                  rows={2}
                  placeholder={'Salad\nDrinks\nDessert'}

                />
              </div>
            )}

            <label className="flex min-h-[44px] items-center gap-3 text-sm text-silver">
              <input type="checkbox" checked={ridesEnabled} onChange={(e) => setRidesEnabled(e.target.checked)} className="h-5 w-5 shrink-0 accent-gold [color-scheme:dark]" />
              Let people offer and ask for rides
            </label>

            {mode === 'edit' && (
              <label className="flex min-h-[44px] items-center gap-3 text-sm text-silver">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-5 w-5 shrink-0 accent-gold [color-scheme:dark]" />
                Tell everyone about this change (only if the time or place moved)
              </label>
            )}
          </div>
        )}

        <div id="post-error"><Notice message={error} className={error ? 'mb-4' : undefined} /></div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={pending}
            fx={false}
            size="lg"
            pending={pending && !savingQuietly}
          >
            {mode === 'create' ? 'Post and tell everyone' : 'Save'}
          </Button>
          {mode === 'create' && (
            <Button
              type="button"
              disabled={pending}
              onClick={() => submit(true)}
              fx={false}
              variant="quiet"
              size="lg"
              pending={pending && savingQuietly}
            >
              Save quietly
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
