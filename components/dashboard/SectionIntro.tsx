import { bibleUrl } from '@/lib/faithflow/guidance';
import { SECTION_FOUNDATIONS } from '@/lib/dashboard/foundations';
import { isFull, type SectionDepth, type SectionKey } from '@/lib/dashboard/journey';

/**
 * The Scripture that grounds a section, shown at the top of its page. The "why"
 * deepens with the member's journey: a gentle first taste early on, the fuller
 * grounding once the section is in full bloom. Always framed as a response to
 * Christ, never a technique.
 */
export function SectionIntro({ section, depth }: { section: SectionKey; depth: SectionDepth }) {
  const f = SECTION_FOUNDATIONS[section];
  const why = isFull(depth) ? f.full : f.gentle;

  return (
    <div className="mb-8 rounded-sm border-l-2 border-gold/60 bg-black-3/60 px-5 py-4">
      <p className="font-display text-base italic leading-relaxed text-ivory-dim md:text-lg">
        &ldquo;{f.verse}&rdquo;
      </p>
      <a
        href={bibleUrl(f.ref)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-[11px] font-medium uppercase tracking-[0.16em] text-gold-lt hover:underline"
      >
        {f.ref} &#8599;
      </a>
      <p className="mt-3 text-sm leading-relaxed text-silver">{why}</p>
    </div>
  );
}
