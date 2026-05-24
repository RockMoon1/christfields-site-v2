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
