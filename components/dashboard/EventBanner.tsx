'use client';

import { useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  eventTheme,
  formatEventWhen,
  eventCountdown,
  type EventMotif,
  type EventTheme,
} from '@/lib/dashboard/events';
import { setEventRsvp, type MemberEvent } from '@/app/dashboard/(app)/events/actions';
import type { EventRsvpStatus } from '@/lib/supabase';

/**
 * The animated events banner on the member dashboard. It appears only when the
 * member's group has an upcoming event. The soonest event is shown large, with
 * lighting and motion themed to the event type (see lib/dashboard/events.ts).
 * The member marks going / not going right here. If there is more than one
 * event, small controls cycle between them.
 *
 * All particle positions are deterministic (no Math.random in render) so the
 * server and client markup match.
 */

interface RsvpView {
  status: EventRsvpStatus | null;
  going: number;
}

export function EventBanner({ events }: { events: MemberEvent[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Optimistic RSVP state keyed by event id, seeded from the server data.
  const [rsvp, setRsvp] = useState<Record<string, RsvpView>>(() => {
    const seed: Record<string, RsvpView> = {};
    for (const e of events) seed[e.id] = { status: e.myStatus, going: e.goingCount };
    return seed;
  });

  if (events.length === 0) return null;

  const safeIndex = Math.min(index, events.length - 1);
  const event = events[safeIndex];
  const theme = eventTheme(event.type);
  const view = rsvp[event.id] ?? { status: event.myStatus, going: event.goingCount };

  function choose(status: EventRsvpStatus) {
    const current = rsvp[event.id] ?? { status: event.myStatus, going: event.goingCount };
    const wasGoing = current.status === 'going';
    const willGoing = status === 'going';
    const nextGoing = Math.max(0, current.going + (willGoing ? 1 : 0) - (wasGoing ? 1 : 0));

    setRsvp((prev) => ({ ...prev, [event.id]: { status, going: nextGoing } }));

    startTransition(async () => {
      const res = await setEventRsvp(event.id, status).catch(() => ({ ok: false }));
      if (!res.ok) {
        setRsvp((prev) => ({ ...prev, [event.id]: current })); // revert
      }
    });
  }

  return (
    <section
      className="relative mb-10 overflow-hidden rounded-md border bg-black-3"
      style={{ borderColor: `${theme.accent}55` }}
      aria-label="Upcoming event"
    >
      {/* Themed ambient gradient + animated motif behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 120% at 15% 0%, ${theme.accent}22 0%, transparent 55%), radial-gradient(120% 140% at 100% 100%, ${theme.accent2}1f 0%, transparent 60%)`,
        }}
      />
      <Motif motif={theme.motif} theme={theme} reduced={!!reduced} />

      {/* Top shimmer hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.accent}cc, transparent)`,
        }}
      />

      <motion.div
        key={event.id}
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 p-6 md:p-9"
      >
        {/* Eyebrow: type + countdown */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em]"
            style={{ color: theme.accent, backgroundColor: `${theme.accent}1a` }}
          >
            <PulseDot color={theme.accent} reduced={!!reduced} />
            {theme.label}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ivory-dim">
            {eventCountdown(event.startsAt)}
          </span>
        </div>

        {/* Title */}
        <h2 className="max-w-2xl font-display text-3xl font-light leading-tight text-ivory md:text-4xl">
          {event.title}
        </h2>

        {/* When / where */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-silver">
          <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
            <CalendarIcon />
            {formatEventWhen(event.startsAt, event.endsAt)}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <PinIcon />
              {event.location}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory-dim">{event.description}</p>
        )}

        {/* RSVP + going count */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => choose('going')}
            disabled={isPending}
            aria-pressed={view.status === 'going'}
            className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-90"
            style={
              view.status === 'going'
                ? { backgroundColor: theme.accent, color: '#06080a', boxShadow: `0 0 22px ${theme.glow}` }
                : { border: `1px solid ${theme.accent}66`, color: theme.accent, backgroundColor: 'transparent' }
            }
          >
            <CheckIcon />
            I&rsquo;m going
          </button>

          <button
            type="button"
            onClick={() => choose('not_going')}
            disabled={isPending}
            aria-pressed={view.status === 'not_going'}
            className={cn(
              'inline-flex items-center gap-2 rounded-sm border px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors',
              view.status === 'not_going'
                ? 'border-border-sub bg-black-2 text-muted'
                : 'border-border-sub text-silver hover:border-ivory/40 hover:text-ivory',
            )}
          >
            Can&rsquo;t make it
          </button>

          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-ivory-dim">
            <PeopleIcon />
            {view.going} going
          </span>
        </div>

        {/* Multiple events: dots + cycle */}
        {events.length > 1 && (
          <div className="mt-6 flex items-center gap-4 border-t border-border-sub/60 pt-4">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Other events">
              {events.map((e, i) => (
                <button
                  key={e.id}
                  type="button"
                  role="tab"
                  aria-selected={i === safeIndex}
                  aria-label={`Show event ${i + 1}: ${e.title}`}
                  onClick={() => setIndex(i)}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === safeIndex ? 22 : 8,
                    backgroundColor: i === safeIndex ? theme.accent : '#3a423e',
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
              {events.length - 1} more coming
            </span>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % events.length)}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-silver transition-colors hover:text-ivory"
            >
              Next <ChevronRight />
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}

/* ============================================================
   Animated background motifs. One per event type. Particle
   positions are deterministic so SSR and the client agree.
   ============================================================ */

function Motif({ motif, theme, reduced }: { motif: EventMotif; theme: EventTheme; reduced: boolean }) {
  if (reduced) {
    // Calm static wash for reduced-motion users.
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(80% 120% at 50% 120%, ${theme.glow} 0%, transparent 60%)`,
        }}
      />
    );
  }

  switch (motif) {
    case 'embers':
      return <Embers theme={theme} />;
    case 'aurora':
      return <Aurora theme={theme} />;
    case 'sunrise':
      return <Sunrise theme={theme} />;
    case 'bokeh':
      return <Bokeh theme={theme} />;
    case 'pulse':
      return <Pulse theme={theme} />;
    case 'confetti':
      return <Confetti theme={theme} />;
    default:
      return null;
  }
}

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 67) % 100,
  size: 3 + (i % 3) * 2,
  delay: (i % 7) * 0.8,
  duration: 6 + (i % 5),
  drift: (i % 2 === 0 ? 1 : -1) * (6 + (i % 4) * 4),
}));

function Embers({ theme }: { theme: EventTheme }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {EMBERS.map((e, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${e.left}%`,
            bottom: -10,
            width: e.size,
            height: e.size,
            backgroundColor: theme.accent,
            boxShadow: `0 0 ${e.size * 2}px ${theme.accent}`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [-0, -260], x: [0, e.drift], opacity: [0, 0.9, 0] }}
          transition={{ duration: e.duration, delay: e.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function Aurora({ theme }: { theme: EventTheme }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: 360,
            height: 220,
            top: `${-20 + i * 22}%`,
            left: `${i * 30 - 10}%`,
            background: i % 2 === 0 ? theme.accent : theme.accent2,
            opacity: 0.18,
          }}
          animate={{ x: [0, 60, -20, 0], y: [0, 18, -10, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 14 + i * 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function Sunrise({ theme }: { theme: EventTheme }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 rounded-full blur-2xl"
        style={{
          width: 460,
          height: 460,
          bottom: -300,
          marginLeft: -230,
          background: `radial-gradient(circle, ${theme.accent} 0%, ${theme.accent2}88 35%, transparent 70%)`,
          opacity: 0.5,
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.42, 0.6, 0.42] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

const BOKEH = Array.from({ length: 9 }, (_, i) => ({
  left: (i * 53) % 100,
  top: (i * 31) % 100,
  size: 26 + (i % 4) * 16,
  delay: (i % 5) * 0.6,
  duration: 9 + (i % 4) * 2,
}));

function Bokeh({ theme }: { theme: EventTheme }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BOKEH.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full blur-xl"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: b.size,
            height: b.size,
            backgroundColor: i % 2 === 0 ? theme.accent : theme.accent2,
            opacity: 0.16,
          }}
          animate={{ y: [0, -16, 0], x: [0, 10, 0], opacity: [0.1, 0.24, 0.1] }}
          transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function Pulse({ theme }: { theme: EventTheme }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: 120, height: 120, border: `1px solid ${theme.accent}` }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 2.6], opacity: [0.5, 0] }}
          transition={{ duration: 5, delay: i * 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 41) % 100,
  delay: (i % 9) * 0.5,
  duration: 4 + (i % 4),
  rotate: (i % 2 === 0 ? 1 : -1) * 360,
  hue: i % 4,
}));

function Confetti({ theme }: { theme: EventTheme }) {
  const palette = [theme.accent, theme.accent2, '#f4ede0', '#5b8db8'];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[1px]"
          style={{
            left: `${c.left}%`,
            top: -12,
            width: 5,
            height: 9,
            backgroundColor: palette[c.hue],
            opacity: 0.85,
          }}
          initial={{ y: -12, rotate: 0, opacity: 0 }}
          animate={{ y: 280, rotate: c.rotate, opacity: [0, 0.9, 0] }}
          transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   Small icons + bits.
   ============================================================ */

function PulseDot({ color, reduced }: { color: string; reduced: boolean }) {
  return (
    <span className="relative inline-block h-1.5 w-1.5">
      {!reduced && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-muted" aria-hidden>
      <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 6h11M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-muted" aria-hidden>
      <path
        d="M8 14s5-4 5-8A5 5 0 003 6c0 4 5 8 5 8z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <circle cx="6" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 13c0-2 1.6-3.5 3.5-3.5S9.5 11 9.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.5 4a2 2 0 010 4M11 9.6c1.6.2 2.8 1.6 2.8 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
