'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  SLOTS,
  SLOT_LABEL,
  SLOT_HINT,
  WEEKDAY_SHORT,
  upcomingDays,
  weeklyKey,
  overrideKey,
  isFree,
  type Slot,
} from '@/lib/dashboard/availability';
import {
  setWeekly,
  setOverride,
  connectCalendar,
  refreshCalendar,
  disconnectCalendar,
  type MyAvailability,
} from '@/app/dashboard/(app)/availability/actions';

const STALE_MS = 6 * 60 * 60 * 1000;

function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Member availability. Connect a private calendar link to auto-fill busy times,
 * set a usual-week pattern, and override specific dates. Leaders only ever see
 * the free/busy result, never why.
 */
export function AvailabilityBoard({ initial }: { initial: MyAvailability }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [weeklyFree, setWeeklyFree] = useState<Set<string>>(() => new Set(initial.weekly));
  const [overrides, setOverrides] = useState<Map<string, boolean>>(
    () => new Map(initial.overrides.map((o) => [overrideKey(o.date, o.slot), o.available])),
  );

  const cal = initial.calendar;
  const calBusy = new Set(cal.busy.map((b) => overrideKey(b.date, b.slot)));
  const days = upcomingDays(14);

  // Auto-refresh a connected calendar when it has gone stale, once per visit.
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

  function toggleWeekly(weekday: number, slot: Slot) {
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

  function cycleOverride(iso: string, slot: Slot) {
    const key = overrideKey(iso, slot);
    const current = overrides.get(key);
    const next: boolean | null = current === undefined ? true : current === true ? false : null;
    setOverrides((prev) => {
      const m = new Map(prev);
      if (next === null) m.delete(key);
      else m.set(key, next);
      return m;
    });
    startTransition(async () => {
      const res = await setOverride(iso, slot, next).catch(() => ({ ok: false }));
      if (!res.ok) {
        setOverrides((prev) => {
          const m = new Map(prev);
          if (current === undefined) m.delete(key);
          else m.set(key, current);
          return m;
        });
      }
    });
  }

  return (
    <div className="space-y-10">
      <CalendarConnect cal={cal} isPending={isPending} startTransition={startTransition} router={router} />

      {/* Usual week */}
      <section>
        <h3 className="mb-1 font-display text-2xl font-light text-ivory">My usual week</h3>
        <p className="mb-5 text-sm text-silver">
          Tap the times you are normally free. This is your baseline; specific days and your
          calendar can change it below.
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="mb-2 grid grid-cols-[88px_repeat(7,1fr)] gap-1.5">
              <div />
              {WEEKDAY_SHORT.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                  {d}
                </div>
              ))}
            </div>
            {SLOTS.map((slot) => (
              <div key={slot} className="mb-1.5 grid grid-cols-[88px_repeat(7,1fr)] items-center gap-1.5">
                <div className="text-xs text-silver">
                  <span className="block text-ivory">{SLOT_LABEL[slot]}</span>
                  <span className="text-[10px] text-muted">{SLOT_HINT[slot]}</span>
                </div>
                {WEEKDAY_SHORT.map((_, weekday) => {
                  const on = weeklyFree.has(weeklyKey(weekday, slot));
                  return (
                    <button
                      key={weekday}
                      type="button"
                      onClick={() => toggleWeekly(weekday, slot)}
                      aria-pressed={on}
                      aria-label={`${WEEKDAY_SHORT[weekday]} ${SLOT_LABEL[slot]} ${on ? 'free' : 'not free'}`}
                      className={cn(
                        'h-9 rounded-sm border text-[10px] font-medium uppercase tracking-[0.08em] transition-colors',
                        on
                          ? 'border-border-gold bg-gold/20 text-gold-lt'
                          : 'border-border-sub bg-black-2 text-muted hover:border-border-gold hover:text-silver',
                      )}
                    >
                      {on ? 'Free' : ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specific dates */}
      <section>
        <h3 className="mb-1 font-display text-2xl font-light text-ivory">Specific dates</h3>
        <p className="mb-5 text-sm text-silver">
          The next two weeks. Tap a slot to override: once for{' '}
          <span className="text-gold-lt">free</span>, again for{' '}
          <span className="text-ivory">busy</span>, again to clear. A{' '}
          <span style={{ color: '#5b8db8' }}>blue dot</span> means your calendar marked it busy.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {days.map((d) => (
            <div
              key={d.iso}
              className="flex items-center justify-between gap-3 rounded-sm border border-border-sub bg-black-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-ivory">{d.dayShort}</p>
                <p className="text-xs text-muted">{d.dateLabel}</p>
              </div>
              <div className="flex gap-1.5">
                {SLOTS.map((slot) => {
                  const key = overrideKey(d.iso, slot);
                  const ov = overrides.get(key);
                  const free = isFree(d.iso, d.weekday, slot, weeklyFree, overrides, calBusy);
                  const explicit = ov !== undefined;
                  const fromCalendar = !explicit && calBusy.has(key);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => cycleOverride(d.iso, slot)}
                      aria-label={`${d.dayShort} ${d.dateLabel} ${SLOT_LABEL[slot]}: ${free ? 'free' : 'busy'}`}
                      className={cn(
                        'relative h-8 w-14 rounded-sm border text-[10px] font-medium uppercase tracking-[0.06em] transition-colors',
                        free
                          ? 'border-border-gold bg-gold/15 text-gold-lt'
                          : 'border-border-sub bg-black-2 text-muted',
                        !explicit && !fromCalendar && 'opacity-70',
                      )}
                      title={
                        fromCalendar
                          ? `${SLOT_LABEL[slot]}: busy from your calendar (tap to override)`
                          : `${SLOT_LABEL[slot]}${explicit ? '' : ' (from your usual week)'}`
                      }
                    >
                      {SLOT_LABEL[slot].slice(0, 3)}
                      {explicit && (
                        <span
                          aria-hidden
                          className={cn(
                            'absolute right-1 top-1 h-1.5 w-1.5 rounded-full',
                            free ? 'bg-gold' : 'bg-silver',
                          )}
                        />
                      )}
                      {fromCalendar && (
                        <span
                          aria-hidden
                          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: '#5b8db8' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   Connect-a-calendar card.
   ============================================================ */

type Transition = (cb: () => void) => void;

function CalendarConnect({
  cal,
  isPending,
  startTransition,
  router,
}: {
  cal: MyAvailability['calendar'];
  isPending: boolean;
  startTransition: Transition;
  router: ReturnType<typeof useRouter>;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function connect() {
    setError('');
    if (!url.trim()) {
      setError('Paste your calendar link first.');
      return;
    }
    startTransition(async () => {
      const res = await connectCalendar(url.trim(), browserTz()).catch(() => ({
        ok: false,
        error: 'Something went wrong.',
      }));
      if (res.ok) {
        setUrl('');
        router.refresh();
      } else {
        setError(res.error ?? 'Could not connect that calendar.');
      }
    });
  }

  function refresh() {
    startTransition(async () => {
      const res = await refreshCalendar(browserTz()).catch(() => ({ ok: false }));
      if (res.ok) router.refresh();
    });
  }

  function disconnect() {
    startTransition(async () => {
      await disconnectCalendar().catch(() => ({ ok: false }));
      router.refresh();
    });
  }

  if (cal.connected) {
    return (
      <section className="rounded-sm border border-border-sub bg-black-3 p-6">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Calendar connected
        </p>
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
            {cal.status === 'ok' ? 'Synced' : cal.status === 'error' ? 'Error' : 'Syncing'}
          </span>
          {cal.lastSyncedAt && (
            <span className="text-xs text-muted" suppressHydrationWarning>
              Updated {new Date(cal.lastSyncedAt).toLocaleString()}
            </span>
          )}
        </div>
        {cal.status === 'error' && cal.error && <p className="mt-2 text-xs text-red-400">{cal.error}</p>}
        <p className="mt-3 text-sm text-silver">
          Your busy times fill in automatically below. We only read free/busy, never event details.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isPending}
            className="rounded-sm border border-gold/45 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-60"
          >
            {isPending ? 'Working…' : 'Refresh now'}
          </button>
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            className="rounded-sm border border-border-sub px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:border-ivory/40 hover:text-ivory disabled:opacity-60"
          >
            Disconnect
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        Connect your calendar
      </p>
      <h3 className="mb-2 font-display text-2xl font-light text-ivory">Let it fill in for you</h3>
      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-silver">
        Paste your calendar&rsquo;s private link and your busy times will fill in automatically, and
        stay in sync. We only ever read free/busy, never what you are doing. Works with Google,
        Apple, and Outlook.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… your private calendar (.ics) link"
          className="flex-1 rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={connect}
          disabled={isPending}
          className="rounded-sm bg-gold px-5 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-gold-lt disabled:opacity-60"
        >
          {isPending ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <details className="mt-4 text-sm text-silver">
        <summary className="cursor-pointer text-gold transition-colors hover:text-gold-lt">
          Where do I find my link?
        </summary>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-silver">
          <p>
            <span className="text-ivory">Google Calendar (computer):</span> Settings → click your
            calendar on the left → Integrate calendar → copy the{' '}
            <span className="text-ivory">Secret address in iCal format</span>.
          </p>
          <p>
            <span className="text-ivory">Apple iCloud:</span> in the Calendar app, share a calendar →
            make it a Public Calendar → copy the link (starts with webcal).
          </p>
          <p>
            <span className="text-ivory">Outlook:</span> Settings → Calendar → Shared calendars →
            Publish a calendar → copy the ICS link.
          </p>
          <p className="text-muted">Keep this link private. Anyone with it can see your busy times.</p>
        </div>
      </details>
    </section>
  );
}
