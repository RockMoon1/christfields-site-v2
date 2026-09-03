import Link from 'next/link';
import type { GroupAvailability } from '@/lib/schedule/group-availability';
import { SLOTS, SLOT_LABEL, type Slot } from '@/lib/dashboard/availability';

/**
 * The three best times, each with names and a Post-this button, then a plain
 * 21-day grid of counts. Cells print "9 of 12 free" and a grey unknown count;
 * names appear only on the best-time cards so a leader can never read a
 * member's busy pattern by absence.
 */
export function WhenToGather({ availability, orgId }: { availability: GroupAvailability; orgId: string }) {
  const { best, days, total } = availability;

  return (
    <div className="space-y-8">
      {best.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border-sub p-6 text-sm text-silver">
          Nobody has told us when they are free yet. Share the group link and ask people to tap their usual times.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {best.map((b) => (
            <div key={`${b.iso}-${b.slot}`} className="rounded-sm border border-border-gold bg-gold/[0.06] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                {b.dayShort}, {b.dateLabel}
              </p>
              <p className="mt-1 font-display text-xl font-light text-ivory">{SLOT_LABEL[b.slot]}</p>
              <p className="mt-1 text-sm text-gold-lt">
                {b.free} of {total} free
              </p>
              <p className="mt-1 text-xs leading-relaxed text-silver">{b.freeNames.join(', ')}</p>
              <Link
                href={`/dashboard/lead/post?org=${encodeURIComponent(orgId)}&date=${b.iso}&slot=${b.slot}`}
                className="mt-3 inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:text-gold-lt"
              >
                Post this &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          <div className="mb-2 grid grid-cols-[100px_repeat(3,1fr)] gap-1.5">
            <div />
            {SLOTS.map((slot) => (
              <div key={slot} className="text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {SLOT_LABEL[slot]}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day.iso} className="mb-1.5 grid grid-cols-[100px_repeat(3,1fr)] items-center gap-1.5">
              <div className="text-xs text-silver">
                <span className="text-ivory">{day.dayShort}</span> {day.dateLabel}
              </div>
              {day.slots.map((cell) => (
                <Cell key={cell.slot} slot={cell.slot} free={cell.free} unknown={cell.unknown} total={total} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ slot, free, unknown, total }: { slot: Slot; free: number; unknown: number; total: number }) {
  const known = Math.max(1, total - unknown);
  const ratio = free / known;
  return (
    <div
      className="flex h-11 flex-col items-center justify-center rounded-sm border border-border-sub text-xs"
      style={{
        backgroundColor: `rgba(201, 165, 72, ${(0.04 + ratio * 0.4).toFixed(3)})`,
        color: ratio > 0.5 ? '#e4c97a' : ratio > 0 ? '#c9b98a' : '#7e8c84',
      }}
      aria-label={`${SLOT_LABEL[slot]}: ${free} of ${total} free${unknown > 0 ? `, ${unknown} unknown` : ''}`}
    >
      <span>
        {free} <span className="text-muted">of {total}</span>
      </span>
      {unknown > 0 && <span className="text-[10px] text-muted">{unknown} unknown</span>}
    </div>
  );
}
