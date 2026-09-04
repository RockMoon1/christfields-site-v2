'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SLOTS, SLOT_LABEL, SLOT_HINT, WEEKDAY_SHORT, weeklyKey, type Slot } from '@/lib/dashboard/availability';
import {
  setWeekly,
  connectCalendar,
  refreshCalendar,
  disconnectCalendar,
  type MyAvailability,
} from '@/app/dashboard/(app)/availability/actions';

const STALE_MS = 6 * 60 * 60 * 1000;
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * The usual-week tap grid (one toggle per tap, no dragging), then the ways a
 * calendar can fill it in instead: Google in one tap when the site has it
 * switched on, or a pasted private link from any calendar. If you connect a
 * calendar and never tap the grid, you count as free wherever it is not busy.
 */
export function AvailabilityBoard({ initial }: { initial: MyAvailability }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weeklyFree, setWeeklyFree] = useState<Set<string>>(() => new Set(initial.weekly));
  const cal = initial.calendar;
  const google = initial.google;

  // Auto-refresh a connected pasted link when it has gone stale, once per visit.
  const didAutoRefresh = useRef(false);
  useEffect(() => {
    if (didAutoRefresh.current) return;
    if (!cal.connected || !cal.lastSyncedAt) return;
    if (Date.now() - Date.parse(cal.lastSyncedAt) <= STALE_MS) return;
    didAutoRefresh.current = true;
    startTransition(async () => {
      const res = await refreshCalendar(browserTz()).catch(() => ({ ok: false }));
      if (res.ok) router.refresh();
    });
  }, [cal.connected, cal.lastSyncedAt, router]);

  function toggle(weekday: number, slot: Slot) {
    const key = weeklyKey(weekday, slot);
    const on = !weeklyFree.has(key);
    setWeeklyFree((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
    startTransition(async () => {
      const res = await setWeekly(weekday, slot, on).catch(() => ({ ok: false }));
      if (!res.ok) {
        setWeeklyFree((prev) => {
          const next = new Set(prev);
          if (on) next.delete(key);
          else next.add(key);
          return next;
        });
      }
    });
  }

  const anyCalendar = cal.connected || (google.configured && google.connected && google.status === 'ok');

  return (
    <div className="space-y-10">
      <section>
        <p className="mb-3 text-sm text-silver">
          {anyCalendar
            ? 'Your calendar fills this in. Tap times below only if you want to narrow it down.'
            : 'Tap the times you are normally free. Tap again to clear.'}
        </p>
        <div className="grid grid-cols-[52px_repeat(3,1fr)] gap-1.5">
          <div />
          {SLOTS.map((slot) => (
            <div key={slot} className="text-center">
              <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{SLOT_LABEL[slot]}</span>
              <span className="block text-[10px] text-muted">{SLOT_HINT[slot]}</span>
            </div>
          ))}
          {WEEK_ORDER.map((weekday) => (
            <div key={weekday} className="contents">
              <div className="flex items-center text-sm text-ivory">{WEEKDAY_SHORT[weekday]}</div>
              {SLOTS.map((slot) => {
                const on = weeklyFree.has(weeklyKey(weekday, slot));
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggle(weekday, slot)}
                    aria-pressed={on}
                    aria-label={`${WEEKDAY_SHORT[weekday]} ${SLOT_LABEL[slot]} ${on ? 'free' : 'not free'}`}
                    className={cn(
                      'min-h-[44px] rounded-sm border text-[11px] font-medium uppercase tracking-[0.08em] transition-colors',
                      on
                        ? 'border-border-gold bg-gold/20 text-gold-lt'
                        : 'border-border-sub bg-black-3 text-muted hover:border-border-gold',
                    )}
                  >
                    {on ? 'Free' : ''}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {google.configured && <GoogleBusyCard google={google} />}

      <CalendarConnect cal={cal} isPending={isPending} startTransition={startTransition} router={router} googleOffered={google.configured} />

      <p className="text-xs leading-relaxed text-muted">
        Calendars count all-day events (a trip, a day off) as free unless you mark them Busy in your calendar app.
      </p>
    </div>
  );
}

function GoogleBusyCard({ google }: { google: MyAvailability['google'] }) {
  const on = google.connected && google.status === 'ok';
  return (
    <section className="rounded-sm border border-border-gold bg-gold/[0.04] p-6">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">One tap</p>
      <h3 className="font-display text-xl font-light text-ivory">Let Google fill this in</h3>
      <p className="mt-2 text-sm leading-relaxed text-silver">
        We check your Google Calendar for the next four weeks and keep only which mornings, afternoons, and evenings
        are busy. We only ever see free or busy. Never what it is.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {on ? (
          <>
            <span className="text-sm text-gold-lt">Connected. We check regularly, usually every hour.</span>
            <Link href="/dashboard/settings" className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-silver">
              Manage on You &rarr;
            </Link>
          </>
        ) : (
          <a
            href="/api/google/connect?feature=busy&from=availability"
            className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
          >
            {google.connected ? 'Connect Google again' : 'Share free or busy from Google'}
          </a>
        )}
      </div>
    </section>
  );
}

type Transition = (cb: () => void) => void;

function CalendarConnect({
  cal,
  isPending,
  startTransition,
  router,
  googleOffered,
}: {
  cal: MyAvailability['calendar'];
  isPending: boolean;
  startTransition: Transition;
  router: ReturnType<typeof useRouter>;
  googleOffered: boolean;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  function connect() {
    setError('');
    if (!url.trim()) {
      setError('Paste your calendar link first.');
      return;
    }
    startTransition(async () => {
      const res = await connectCalendar(url.trim(), browserTz()).catch(() => ({ ok: false, error: 'Something went wrong.' }));
      if (res.ok) {
        setUrl('');
        router.refresh();
      } else {
        setError(res.error ?? 'Could not connect that calendar.');
      }
    });
  }

  if (cal.connected) {
    return (
      <section className="rounded-sm border border-border-sub bg-black-3 p-6">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Your calendar link is connected</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm text-ivory">{cal.host ?? 'Your calendar'}</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              cal.status === 'ok'
                ? 'bg-emerald-bright/15 text-emerald-bright'
                : cal.status === 'error'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-gold/15 text-gold',
            )}
          >
            {cal.status === 'ok' ? 'Working' : cal.status === 'error' ? 'Problem' : 'Checking'}
          </span>
        </div>
        {cal.status === 'error' && cal.error && <p className="mt-2 text-xs text-red-400">{cal.error}</p>}
        <p className="mt-3 text-sm text-silver">
          Your busy times fill in on their own. We only read free or busy, never what it is.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => startTransition(async () => { const r = await refreshCalendar(browserTz()).catch(() => ({ ok: false })); if (r.ok) router.refresh(); })}
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black disabled:opacity-60"
          >
            {isPending ? 'Working…' : 'Check again'}
          </button>
          <button
            type="button"
            onClick={() => startTransition(async () => { await disconnectCalendar().catch(() => ({ ok: false })); router.refresh(); })}
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-silver hover:text-ivory disabled:opacity-60"
          >
            Disconnect
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-border-sub bg-black-3 p-6">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">{googleOffered ? 'Any other calendar' : 'Optional'}</p>
      <h3 className="font-display text-xl font-light text-ivory">{googleOffered ? 'Or paste a calendar link' : 'Let your calendar fill this in'}</h3>
      <p className="mt-2 text-sm leading-relaxed text-silver">
        Paste your calendar&rsquo;s private link and your busy times fill in on their own. We only ever read
        free or busy, never what you are doing. Works with {googleOffered ? 'Apple, Outlook, and Google' : 'Google, Apple, and Outlook'}.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black"
        >
          Paste my calendar link
        </button>
      ) : (
        <div className="mt-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… your private calendar link"
              className="min-h-[44px] flex-1 rounded-sm border border-border-sub bg-black-2 px-3 text-base text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
            />
            <button
              type="button"
              onClick={connect}
              disabled={isPending}
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt disabled:opacity-60"
            >
              {isPending ? 'Connecting…' : 'Connect'}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <details className="mt-4 text-sm text-silver">
            <summary className="cursor-pointer text-gold hover:text-gold-lt">Where do I find my link?</summary>
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-silver">
              <p>
                <span className="text-ivory">Google Calendar (computer):</span> Settings, click your calendar on the left,
                Integrate calendar, copy the <span className="text-ivory">Secret address in iCal format</span>.
              </p>
              <p>
                <span className="text-ivory">Apple iCloud:</span> in the Calendar app, share a calendar, make it a Public
                Calendar, copy the link (starts with webcal).
              </p>
              <p>
                <span className="text-ivory">Outlook:</span> Settings, Calendar, Shared calendars, Publish a calendar, copy
                the ICS link.
              </p>
              <p className="text-muted">Keep this link private. Anyone with it can see your busy times.</p>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
