import Link from 'next/link';
import { SLOTS, SLOT_LABEL } from '@/lib/dashboard/availability';
import type { PlanDay, PlanBest } from '@/app/dashboard/(leader)/leader/plan/actions';
import { PlanCell } from './PlanCell';

/**
 * Read-only planning heatmap for leaders. Shows, for the next three weeks, how
 * many members are free in each morning/afternoon/evening slot, with the best
 * times pulled out on top. Server-rendered; each cell taps open to name who is
 * free, since a hover tooltip is invisible on the iPad this page is built for.
 */
export function PlanBoard({
  total,
  days,
  best,
}: {
  total: number;
  days: PlanDay[];
  best: PlanBest[];
}) {
  return (
    <div className="space-y-10">
      {/* Best times to gather */}
      <section>
        <h2 className="mb-1 font-display text-2xl font-light text-ivory">Best times to gather</h2>
        <p className="mb-5 text-sm text-silver">
          When the most people are free over the next three weeks. {total} in your group.
        </p>

        {best.length === 0 ? (
          <div className="rounded-md border border-dashed border-border-sub p-6 text-sm text-silver">
            No one has set their availability yet. Once members fill in their availability, the best
            times to meet will show up here.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {best.map((b) => (
              <div
                key={`${b.iso}-${b.slot}`}
                className="rounded-md border border-border-gold bg-gold/[0.06] p-4"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                  {b.dayShort}, {b.dateLabel}
                </p>
                <p className="mt-1 font-display text-xl font-light text-ivory">{SLOT_LABEL[b.slot]}</p>
                <p className="mt-1 text-sm text-gold-lt">
                  {b.freeCount} of {total} free
                </p>
                <Link
                  href="/dashboard/leader/events"
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-gold transition-colors hover:text-gold-lt"
                >
                  Create an event &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Full heatmap */}
      <section>
        <h2 className="mb-1 font-display text-2xl font-light text-ivory">The next three weeks</h2>
        <p className="mb-5 text-sm text-silver">
          Brighter means more people are free. Tap a cell to see who.
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[460px]">
            <div className="mb-2 grid grid-cols-[120px_repeat(3,1fr)] gap-1.5">
              <div />
              {SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted"
                >
                  {SLOT_LABEL[slot]}
                </div>
              ))}
            </div>

            {days.map((day) => (
              <div
                key={day.iso}
                className="mb-1.5 grid grid-cols-[120px_repeat(3,1fr)] items-center gap-1.5"
              >
                <div className="text-xs text-silver">
                  <span className="text-ivory">{day.dayShort}</span> {day.dateLabel}
                </div>
                {day.slots.map((cell) => (
                  <PlanCell
                    key={cell.slot}
                    freeCount={cell.freeCount}
                    total={total}
                    freeNames={cell.freeNames}
                    label={`${day.dayShort} ${day.dateLabel}, ${SLOT_LABEL[cell.slot]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
