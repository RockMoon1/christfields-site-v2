'use client';

import { useState, useTransition } from 'react';
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
import { setWeekly, setOverride, type MyAvailability } from '@/app/dashboard/(app)/availability/actions';

/**
 * Member availability. Two parts:
 *  - "My usual week": a 3-slot x 7-day grid you tap to mark when you are
 *    normally free.
 *  - "Specific dates": the next two weeks, where you can override the usual
 *    pattern (free or busy) for a particular day.
 * Leaders only ever see the free/busy result, never why.
 */
export function AvailabilityBoard({ initial }: { initial: MyAvailability }) {
  const [, startTransition] = useTransition();

  const [weeklyFree, setWeeklyFree] = useState<Set<string>>(() => new Set(initial.weekly));
  const [overrides, setOverrides] = useState<Map<string, boolean>>(
    () => new Map(initial.overrides.map((o) => [overrideKey(o.date, o.slot), o.available])),
  );

  const days = upcomingDays(14);

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
    const current = overrides.get(key); // undefined | true | false
    // inherit -> free -> busy -> inherit
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
      {/* Usual week */}
      <section>
        <h3 className="mb-1 font-display text-2xl font-light text-ivory">My usual week</h3>
        <p className="mb-5 text-sm text-silver">
          Tap the times you are normally free. This is your baseline; you can change specific days
          below.
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Header row of weekdays */}
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
          The next two weeks. Tap a slot to override your usual week: once for{' '}
          <span className="text-gold-lt">free</span>, again for{' '}
          <span className="text-ivory">busy</span>, again to clear it.
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
                  const free = isFree(d.iso, d.weekday, slot, weeklyFree, overrides);
                  const explicit = ov !== undefined;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => cycleOverride(d.iso, slot)}
                      aria-label={`${d.dayShort} ${d.dateLabel} ${SLOT_LABEL[slot]}: ${
                        free ? 'free' : 'busy'
                      }${explicit ? ' (set)' : ' (usual)'}`}
                      className={cn(
                        'relative h-8 w-14 rounded-sm border text-[10px] font-medium uppercase tracking-[0.06em] transition-colors',
                        free
                          ? 'border-border-gold bg-gold/15 text-gold-lt'
                          : 'border-border-sub bg-black-2 text-muted',
                        !explicit && 'opacity-70',
                      )}
                      title={`${SLOT_LABEL[slot]}${explicit ? '' : ' (from your usual week)'}`}
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
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          A dot means you set that day specifically. No dot means it follows your usual week.
        </p>
      </section>
    </div>
  );
}
