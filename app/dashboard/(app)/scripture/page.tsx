import { VerseOfDayCard } from '@/components/dashboard/VerseOfDayCard';
import { MemoryVerses } from '@/components/dashboard/MemoryVerses';
import { SectionIntro } from '@/components/dashboard/SectionIntro';
import { getScripture } from './actions';
import { getJourney } from '@/lib/dashboard/journey-data';

/**
 * Scripture page. Fetches the verse of the day and the user's memory verses
 * server-side, then hands them to client components for rendering and interaction.
 */
export default async function ScripturePage() {
  const [data, journey] = await Promise.all([getScripture(), getJourney()]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Hide it in your heart
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Scripture
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          A verse to carry today, and the ones you are learning by heart.
        </p>
      </header>

      <SectionIntro section="scripture" depth={journey.sections.scripture} />

      {/* Carrying something in the moment is GraceFlow's lane, not FaithFlow's.
          Hand it off (link, don't rebuild) so this stays the community space. */}
      <section className="mb-8 rounded-md border border-border-sub bg-black-3 p-6 md:p-7">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Carrying something today?
        </p>
        <h3 className="mb-2 font-display text-xl font-light text-ivory md:text-2xl">
          A verse for the moment lives in GraceFlow
        </h3>
        <p className="mb-4 max-w-xl text-sm leading-relaxed text-silver">
          When something is heavy and you need the right Scripture right now, GraceFlow meets you in
          the moment with a verse for whatever you are facing, in its true context, plus a short
          reflection and a prayer. Here, we keep Scripture for carrying together and talking it
          through face to face.
        </p>
        <a
          href="https://graceflows.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-gold transition-colors hover:text-gold-lt"
        >
          Open GraceFlow &#8599;
        </a>
      </section>

      <div className="space-y-10">
        <VerseOfDayCard verse={data.verseOfDay} />
        <MemoryVerses
          learning={data.learning}
          memorized={data.memorized}
          dueCount={data.dueCount}
        />
      </div>
    </div>
  );
}
