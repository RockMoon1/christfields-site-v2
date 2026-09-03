import Link from 'next/link';
import type { ChangedLine } from '@/app/dashboard/(app)/events/actions';
import { relativeDays } from '@/lib/dashboard/format';

/**
 * What changed in the last seven days: moves and cancellations, one line each.
 * This is the source of truth a missed push never costs anyone. Renders
 * nothing when nothing changed.
 */
export function ChangedStrip({ lines, tz }: { lines: ChangedLine[]; tz: string }) {
  if (lines.length === 0) return null;
  return (
    <section aria-label="Changed" className="mb-5 rounded-sm border border-border-sub bg-black-3/60 px-4 py-3">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Changed</p>
      <ul className="space-y-1.5">
        {lines.map((l) => (
          <li key={`${l.eventId}-${l.at}`} className="text-sm leading-snug">
            <Link href={`/dashboard/e/${l.eventId}`} className="text-ivory-dim hover:text-ivory">
              {l.summary || (l.kind === 'cancelled' ? `${l.title} is called off` : `${l.title} changed`)}
            </Link>
            <span className="ml-2 text-xs text-muted">{relativeDays(l.at, tz)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
