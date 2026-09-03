'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { eventTheme } from '@/lib/dashboard/events';
import type { EventRsvpStatus } from '@/lib/supabase';
import type { RsvpFace } from '@/lib/schedule/public-event';
import type { FeedEvent } from '@/app/dashboard/(app)/events/actions';
import { setRsvp } from '@/app/dashboard/(app)/events/actions';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { GoingFaces } from './GoingFaces';
import { AddToCalendar } from './AddToCalendar';
import { PinIcon, CheckIcon } from './nav-data';

/**
 * One event, one decision. Title, when in words, where, who is in, and the
 * three buttons. Answers are optimistic: apply immediately, roll back the
 * exact previous state if the server says no. After a yes the card flips to a
 * confirmation with exactly one next action, "Put it on my calendar".
 */
export function EventCard({
  event,
  whenText,
  googleUrl,
  icsToken,
  big = false,
  showGroup = false,
  linkToEvent = true,
}: {
  event: FeedEvent;
  whenText: string;
  googleUrl: string;
  /** Lets the .ics download work with no session (the route sits outside Clerk). */
  icsToken?: string;
  big?: boolean;
  showGroup?: boolean;
  linkToEvent?: boolean;
}) {
  const theme = eventTheme(event.type);
  const [status, setStatus] = useState<EventRsvpStatus | null>(event.myStatus);
  const [faces, setFaces] = useState<RsvpFace[]>(event.faces);
  const [justAnswered, setJustAnswered] = useState(false);
  const [pending, startTransition] = useTransition();
  const cancelled = event.status === 'cancelled';

  function choose(next: EventRsvpStatus) {
    const prevStatus = status;
    const prevFaces = faces;
    setStatus(next);
    setJustAnswered(true);
    startTransition(async () => {
      const res = await setRsvp(event.id, next).catch(() => ({ ok: false as const }));
      if (!res.ok) {
        setStatus(prevStatus);
        setFaces(prevFaces);
        setJustAnswered(false);
        return;
      }
      if (res.faces) setFaces(res.faces);
    });
  }

  const title = linkToEvent ? (
    <Link href={`/dashboard/e/${event.id}`} className="hover:text-gold-lt">
      {event.title}
    </Link>
  ) : (
    event.title
  );

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-sm border bg-black-3',
        big ? 'p-6 md:p-8' : 'p-5',
        cancelled ? 'border-border-sub opacity-90' : 'border-border-sub',
      )}
      style={cancelled ? undefined : { borderColor: `${theme.accent}55` }}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}cc, transparent)` }} />

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: theme.accent, backgroundColor: `${theme.accent}1a` }}
        >
          {theme.label}
        </span>
        {showGroup && (
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">{event.orgName}</span>
        )}
        {cancelled && (
          <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-red-300">
            Called off
          </span>
        )}
      </div>

      <h2 className={cn('font-display font-light leading-tight text-ivory', big ? 'text-3xl md:text-4xl' : 'text-2xl')}>
        {title}
      </h2>

      <p className={cn('mt-2 text-ivory-dim', big ? 'text-lg' : 'text-base')}>{whenText}</p>
      {event.location && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-sm text-silver hover:text-ivory"
        >
          <span className="h-3.5 w-3.5 text-muted">
            <PinIcon />
          </span>
          {event.location}
        </a>
      )}
      {big && event.description && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-silver">{event.description}</p>
      )}

      {cancelled ? (
        <p className="mt-4 text-sm leading-relaxed text-silver">
          {event.cancelReason ? event.cancelReason : 'This one is not happening. Your leader called it off.'}
        </p>
      ) : (
        <>
          <div className="mt-4">
            <GoingFaces faces={faces} compact={!big} />
          </div>

          {status && justAnswered && status !== 'not_going' ? (
            <div className="mt-5 rounded-sm border border-border-gold bg-gold/[0.06] p-4">
              <div className="flex items-center gap-3">
                <SuccessCheck size={36} />
                <p className="font-display text-xl text-ivory">
                  {status === 'going' ? `You are in. ${whenText}.` : `Noted. We will remind you ${whenText.toLowerCase()}.`}
                </p>
              </div>
              <div className="mt-4">
                <AddToCalendar eventId={event.id} googleUrl={googleUrl} token={icsToken} />
              </div>
              <button
                type="button"
                onClick={() => setJustAnswered(false)}
                className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-silver"
              >
                Change my answer
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <RsvpButton
                active={status === 'going'}
                onClick={() => choose('going')}
                disabled={pending}
                accent={theme.accent}
                primary
              >
                <span className="h-4 w-4">
                  <CheckIcon />
                </span>
                I&rsquo;m in
              </RsvpButton>
              <RsvpButton active={status === 'maybe'} onClick={() => choose('maybe')} disabled={pending} accent={theme.accent}>
                Not sure yet
              </RsvpButton>
              <RsvpButton active={status === 'not_going'} onClick={() => choose('not_going')} disabled={pending} accent={theme.accent}>
                I can&rsquo;t make it
              </RsvpButton>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function RsvpButton({
  active,
  onClick,
  disabled,
  accent,
  primary = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  accent: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm border px-4 text-sm font-medium transition-colors',
        active
          ? 'border-transparent text-black'
          : primary
            ? 'border-transparent bg-transparent text-ivory hover:opacity-90'
            : 'border-border-sub bg-black-2 text-silver hover:border-ivory/40 hover:text-ivory',
        disabled && 'opacity-70',
      )}
      style={
        active
          ? { backgroundColor: accent }
          : primary
            ? { border: `1px solid ${accent}99`, color: accent }
            : undefined
      }
    >
      {children}
    </button>
  );
}
