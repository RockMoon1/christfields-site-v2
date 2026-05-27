import { RhythmBoard } from '@/components/dashboard/RhythmBoard';
import { SectionIntro } from '@/components/dashboard/SectionIntro';
import { getRhythms } from './actions';
import { getJourney } from '@/lib/dashboard/journey-data';
import { SABBATH_NOTE } from '@/lib/dashboard/foundations';
import { bibleUrl } from '@/lib/faithflow/guidance';

/**
 * Rhythms page. Fetches the user's practices and logs server-side, then
 * hands them to the client RhythmBoard for interaction and animation.
 */
export default async function RhythmsPage() {
  const [rhythms, journey] = await Promise.all([getRhythms(), getJourney()]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Your rhythms
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">Rhythms</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          The practices you keep returning to. This is about faithfulness, not perfection.
        </p>
      </header>

      <SectionIntro section="rhythms" depth={journey.sections.rhythms} />

      {/* Why the Sabbath rhythm is daily, not once a week. People kept reading
          the Sabbath card as "Sunday only," so we explain the theology plainly:
          the veil tore, rest is a Person, and the church shares life often. */}
      <section className="relative mb-8 overflow-hidden rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          {SABBATH_NOTE.eyebrow}
        </p>
        <h2 className="mb-3 font-display text-2xl font-light text-ivory md:text-3xl">
          {SABBATH_NOTE.title}
        </h2>
        <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-silver">
          {SABBATH_NOTE.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5">
          {SABBATH_NOTE.refs.map((ref) => (
            <span key={ref.label} className="text-[11px] leading-relaxed">
              <a
                href={bibleUrl(ref.label)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium uppercase tracking-[0.14em] text-gold-lt hover:underline"
              >
                {ref.label} &#8599;
              </a>
              <span className="ml-1.5 text-muted">{ref.note}</span>
            </span>
          ))}
        </div>
      </section>

      <RhythmBoard initialRhythms={rhythms} />
    </div>
  );
}
