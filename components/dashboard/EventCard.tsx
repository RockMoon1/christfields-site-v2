'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition, type Ref } from 'react';
import { cn } from '@/lib/utils';
import { eventTheme } from '@/lib/dashboard/events';
import type { EventRsvpStatus } from '@/lib/supabase';
import type { RsvpFace } from '@/lib/schedule/public-event';
import type { FeedEvent } from '@/app/dashboard/(app)/events/actions';
import { setRsvp } from '@/app/dashboard/(app)/events/actions';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { Button } from '@/components/Button';
import { Notice } from '@/components/ui/Notice';
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
  headingLevel = 2,
}: {
  event: FeedEvent;
  whenText: string;
  googleUrl: string;
  /** Lets the .ics download work with no session (the route sits outside Clerk). */
  icsToken?: string;
  big?: boolean;
  showGroup?: boolean;
  linkToEvent?: boolean;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const ConfirmationHeading = headingLevel === 1 ? 'h2' : 'h3';
  const theme = eventTheme(event.type);
  // The blue chip's translucent fill lowers text contrast; keep its accent
  // for materials and use a lighter foreground on that chip alone.
  const chipForeground = event.type === 'outing' ? '#6f9cc2' : theme.accent;
  const [status, setStatus] = useState<EventRsvpStatus | null>(event.myStatus);
  const [faces, setFaces] = useState<RsvpFace[]>(event.faces);
  const [justAnswered, setJustAnswered] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const choices = useRef<Partial<Record<EventRsvpStatus, HTMLButtonElement | null>>>({});
  const confirmation = useRef<HTMLHeadingElement>(null);
  const focusRequest = useRef<{ target: EventRsvpStatus | 'confirmation'; onlyIfUnclaimed: boolean } | null>(null);
  const cancelled = event.status === 'cancelled';

  // Wait until disabled choices or the confirmation have finished changing.
  // An answer completing must not pull focus back from another task.
  useEffect(() => {
    if (pending || !focusRequest.current) return;
    const { target, onlyIfUnclaimed } = focusRequest.current;
    focusRequest.current = null;
    const active = document.activeElement;
    if (!onlyIfUnclaimed || !active || active === document.body || active === document.documentElement) {
      (target === 'confirmation' ? confirmation.current : choices.current[target])?.focus();
    }
  }, [pending, justAnswered, status]);

  function choose(next: EventRsvpStatus) {
    if (pending) return;
    const prevStatus = status;
    const prevFaces = faces;
    setAnswerError(null);
    setStatus(next);
    setJustAnswered(false);
    startTransition(async () => {
      const res = await setRsvp(event.id, next).catch(() => ({ ok: false as const }));
      if (!res.ok) {
        focusRequest.current = { target: next, onlyIfUnclaimed: true };
        setStatus(prevStatus);
        setFaces(prevFaces);
        setJustAnswered(false);
        setAnswerError('Could not save your answer. Your previous answer is still in place. Please try again.');
        return;
      }
      if (res.faces) setFaces(res.faces);
      focusRequest.current = { target: next === 'not_going' ? next : 'confirmation', onlyIfUnclaimed: true };
      setJustAnswered(true);
    });
  }

  const title = linkToEvent ? (
    <Link href={`/dashboard/e/${event.id}`} className="inline-flex min-h-11 max-w-full items-center transition-colors duration-200 hover:text-gold-lt focus-visible:text-gold-lt">
      {event.title}
    </Link>
  ) : (
    event.title
  );

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-sm border border-border-sub bg-black-3',
        big ? 'p-6 md:p-8' : 'p-5',
      )}
      style={cancelled ? undefined : { borderColor: `${theme.accent}55` }}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}cc, transparent)` }} />

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-meta font-medium uppercase tracking-[0.12em]"
          style={{ color: chipForeground, backgroundColor: `${theme.accent}1a` }}
        >
          {theme.label}
        </span>
        {showGroup && (
          <span className="min-w-0 text-meta font-medium uppercase tracking-[0.12em] text-muted [overflow-wrap:anywhere]">{event.orgName}</span>
        )}
        {cancelled && (
          <span className="rounded-full bg-danger-dk/40 px-2.5 py-1 text-sm font-medium text-danger-lt">
            Called off
          </span>
        )}
      </div>

      <Heading className={cn('font-display font-light leading-tight text-ivory [overflow-wrap:anywhere]', big ? 'text-3xl md:text-4xl' : 'text-2xl')}>
        {title}
      </Heading>

      <p className={cn('mt-2 text-ivory-dim [overflow-wrap:anywhere]', big ? 'text-lg' : 'text-base')}>{whenText}</p>
      {event.location && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex min-h-11 max-w-full items-center gap-2 py-2 text-sm text-silver transition-colors duration-200 hover:text-ivory focus-visible:text-ivory"
        >
          <span aria-hidden className="h-4 w-4 shrink-0 text-muted">
            <PinIcon />
          </span>
          <span className="min-w-0 [overflow-wrap:anywhere]">{event.location}</span>
        </a>
      )}
      {big && event.description && (
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-silver [overflow-wrap:anywhere]">{event.description}</p>
      )}

      {cancelled ? (
        <p className="mt-4 text-sm leading-relaxed text-silver [overflow-wrap:anywhere]">
          {event.cancelReason ? event.cancelReason : 'This one is not happening. Your leader called it off.'}
        </p>
      ) : (
        <>
          <div className="mt-4">
            <GoingFaces faces={faces} compact={!big} />
          </div>

          {status && justAnswered && status !== 'not_going' ? (
            <div className="mt-5 rounded-sm border border-border-gold bg-gold/[0.06] p-4">
              <div className="flex items-start gap-3">
                <span aria-hidden className="shrink-0"><SuccessCheck size={36} /></span>
                <ConfirmationHeading ref={confirmation} tabIndex={-1} className="min-w-0 font-display text-2xl leading-snug text-ivory [overflow-wrap:anywhere]">
                  {status === 'going' ? `You are in. ${whenText}.` : `Noted. We will remind you ${whenText.toLowerCase()}.`}
                </ConfirmationHeading>
              </div>
              <div className="mt-4">
                <AddToCalendar eventId={event.id} googleUrl={googleUrl} token={icsToken} />
              </div>
              <Button
                fx={false}
                variant="quiet"
                size="sm"
                onClick={() => {
                  focusRequest.current = { target: status, onlyIfUnclaimed: false };
                  setJustAnswered(false);
                }}
                className="mt-3"
              >
                Change my answer
              </Button>
            </div>
          ) : (
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <RsvpButton
                ref={(node) => { choices.current.going = node; }}
                active={status === 'going'}
                onClick={() => choose('going')}
                disabled={pending}
                accent={theme.accent}
                primary
              >
                <span aria-hidden className="h-4 w-4 shrink-0">
                  <CheckIcon />
                </span>
                I&rsquo;m in
              </RsvpButton>
              <RsvpButton ref={(node) => { choices.current.maybe = node; }} active={status === 'maybe'} onClick={() => choose('maybe')} disabled={pending} accent={theme.accent}>
                Not sure yet
              </RsvpButton>
              <RsvpButton ref={(node) => { choices.current.not_going = node; }} active={status === 'not_going'} onClick={() => choose('not_going')} disabled={pending} accent={theme.accent}>
                I can&rsquo;t make it
              </RsvpButton>
            </div>
          )}
          {status === 'not_going' && justAnswered && (
            <p className="mt-3 text-sm leading-relaxed text-silver">
              Thanks for letting us know. Want your leader to pick times that work for you?{' '}
              <Link href="/dashboard/availability" className="inline-flex min-h-11 items-center py-2 text-gold transition-colors duration-200 hover:text-gold-lt focus-visible:text-gold-lt">
                Tell us when you are free &rarr;
              </Link>
            </p>
          )}
        </>
      )}
      <Notice message={answerError} />
    </article>
  );
}

function RsvpButton({
  ref,
  active,
  onClick,
  disabled,
  accent,
  primary = false,
  children,
}: {
  ref?: Ref<HTMLButtonElement>;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  accent: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled || undefined}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-12 min-w-0 w-full items-center justify-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition-colors duration-200',
        active
          ? 'border-transparent text-black'
          : primary
            ? 'border-transparent bg-transparent text-ivory hover:bg-white/[0.04] focus-visible:bg-white/[0.04]'
            : 'border-border-sub bg-black-2 text-silver hover:border-ivory/40 hover:text-ivory focus-visible:border-ivory/40 focus-visible:text-ivory',
        disabled && 'cursor-wait',
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
