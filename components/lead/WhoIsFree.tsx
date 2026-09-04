'use client';

import type { GroupAvailability } from '@/lib/schedule/group-availability';
import { SLOT_LABEL, SLOT_DEFAULT_HOUR, slotForLocalHour } from '@/lib/dashboard/availability';

export interface UpcomingLite {
  id: string;
  title: string;
  startsAt: string;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Lives under the When field on the Post form. As the leader picks a day and
 * time it answers the only question that matters: who can come? A warning
 * when most people are busy, a one-tap move to the best time, and a note when
 * the group already has something that day. It never blocks posting.
 */
export function WhoIsFree({
  when,
  availability,
  upcoming,
  onPick,
}: {
  when: string;
  availability: GroupAvailability | null;
  upcoming: UpcomingLite[];
  onPick: (localValue: string) => void;
}) {
  if (!when || !availability || availability.total === 0) return null;
  const date = when.slice(0, 10);
  const hour = Number(when.slice(11, 13));
  const slot = slotForLocalHour(Number.isFinite(hour) ? hour : -1);
  const day = availability.days.find((d) => d.iso === date);
  const sameDay = upcoming.filter((e) => localDate(e.startsAt) === date);

  const box = 'mt-2 rounded-sm border px-4 py-3 text-sm leading-relaxed';

  if (!day) {
    return (
      <div className={`${box} border-border-sub text-silver`}>
        That is more than three weeks out. We only know who is free for the next three weeks.
        {sameDay.length > 0 && <SameDay list={sameDay} />}
      </div>
    );
  }
  if (!slot) {
    return (
      <div className={`${box} border-border-sub text-silver`}>
        That is late. Most people will be asleep.
        {sameDay.length > 0 && <SameDay list={sameDay} />}
      </div>
    );
  }

  const cell = day.slots.find((s) => s.slot === slot);
  const free = cell?.free ?? 0;
  const unknown = cell?.unknown ?? 0;
  const known = Math.max(0, availability.total - unknown);
  const best = availability.best[0];
  const isBest = best && best.iso === date && best.slot === slot;
  const thin = known >= 3 && free < known / 2;
  const betterExists = best && !isBest && best.free >= free + 3;
  const warn = thin || betterExists;

  return (
    <div className={`${box} ${warn ? 'border-amber-500/40 bg-amber-500/5 text-ivory' : 'border-border-sub text-silver'}`}>
      <p>
        <span className="text-ivory">{free} of {availability.total}</span> free {day.dayShort} {SLOT_LABEL[slot].toLowerCase()}
        {unknown > 0 && <span className="text-muted">, {unknown} have not told us</span>}.
        {known === 0 && ' Nobody has told us when they are free yet.'}
      </p>
      {warn && best && !isBest && (
        <p className="mt-1.5">
          {thin ? 'Most people are busy then.' : 'A better time is open.'}{' '}
          <button
            type="button"
            onClick={() => onPick(`${best.iso}T${pad(SLOT_DEFAULT_HOUR[best.slot])}:00`)}
            className="text-gold underline-offset-2 hover:text-gold-lt hover:underline"
          >
            Move to {best.dayShort}, {best.dateLabel} {SLOT_LABEL[best.slot].toLowerCase()} ({best.free} free)
          </button>
        </p>
      )}
      {sameDay.length > 0 && <SameDay list={sameDay} />}
    </div>
  );
}

function SameDay({ list }: { list: UpcomingLite[] }) {
  return (
    <p className="mt-1.5 text-muted">
      Also that day: {list.map((e) => e.title).join(', ')}.
    </p>
  );
}
