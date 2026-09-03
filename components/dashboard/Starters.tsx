import { noteLines } from '@/lib/dashboard/prompts';

/**
 * Two things you could ask someone. Shown only to members who said they are in
 * or not sure, in a quiet section at the bottom of the event page and in the
 * two-hour reminder. Never a list, never counted.
 */
export function Starters({ note }: { note: string }) {
  const lines = noteLines(note, 2);
  if (lines.length === 0) return null;
  return (
    <section className="rounded-sm border-l-2 border-gold/60 bg-black-3/60 px-5 py-4">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        {lines.length === 1 ? 'Something you could ask someone' : 'Two things you could ask someone'}
      </p>
      <ul className="space-y-1.5">
        {lines.map((l) => (
          <li key={l} className="font-display text-lg leading-snug text-ivory-dim">
            {l}
          </li>
        ))}
      </ul>
    </section>
  );
}
