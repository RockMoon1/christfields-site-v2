import type { MemberEvent } from '@/lib/schedule/public-event';
import { bibleUrl } from '@/lib/dashboard/bible';
import { noteLines } from '@/lib/dashboard/prompts';

/**
 * The passage a leader chose for this gathering, their one line on why, and
 * the questions the group will sit with. Members see all of it; a leader's
 * context notes never come through here (they are not on MemberEvent at all).
 */
export function FromTheWord({ event }: { event: MemberEvent }) {
  const questions = noteLines(event.discussion, 3);
  if (!event.scriptureRef && !event.scriptureText && !event.scriptureWhy && questions.length === 0) return null;
  return (
    <section className="rounded-sm border border-border-gold bg-gold/[0.04] p-5 md:p-6">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">From the Word</p>
      {event.scriptureRef && (
        <a
          href={bibleUrl(event.scriptureRef)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-2xl font-light text-ivory hover:text-gold-lt"
        >
          {event.scriptureRef}
        </a>
      )}
      {event.scriptureText && (
        <blockquote className="mt-3 border-l-2 border-gold/50 pl-4 font-display text-lg font-light leading-relaxed text-ivory-dim">
          {event.scriptureText}
        </blockquote>
      )}
      {event.scriptureWhy && <p className="mt-3 text-base leading-relaxed text-silver">{event.scriptureWhy}</p>}
      {questions.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">We will sit with</p>
          <ol className="space-y-1.5 pl-5 text-base leading-snug text-ivory-dim marker:text-gold">
            {questions.map((q, i) => (
              <li key={`${i}-${q}`} className="list-decimal">
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
