import type { Verse } from '@/lib/dashboard/verses';
import { verseLink } from '@/lib/dashboard/verses';

/**
 * One verse, small, at the top of Home. No streak, no count, no button to
 * "mark as read". Most of the Word in this community happens in the room;
 * this is a doorway, not a program.
 */
export function VerseCard({ verse, eyebrow = 'Today' }: { verse: Verse; eyebrow?: string }) {
  return (
    <section className="mb-6 rounded-sm border border-border-sub bg-black-3/70 px-5 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        {eyebrow} &middot; {verse.ref}
      </p>
      {verse.text && <p className="mt-1.5 font-display text-lg font-light leading-relaxed text-ivory">{verse.text}</p>}
      <a
        href={verseLink(verse)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-gold"
      >
        Read it in context &rarr;
      </a>
    </section>
  );
}
