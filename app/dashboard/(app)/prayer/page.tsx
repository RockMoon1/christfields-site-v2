import { PrayerBoard } from '@/components/dashboard/PrayerBoard';
import { SectionIntro } from '@/components/dashboard/SectionIntro';
import { getPrayers } from './actions';
import { getJourney } from '@/lib/dashboard/journey-data';

/**
 * Prayer page. Fetches the signed-in user's open and answered requests
 * server-side and passes them as initial data to the client PrayerBoard.
 */
export default async function PrayerPage() {
  const [{ open, answered }, journey] = await Promise.all([getPrayers(), getJourney()]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Between you and God
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Prayer
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          Your prayers are between you and the Father. This is just a place to hold them, to keep
          praying, and to remember his faithfulness. Pray honestly, and lean on his will more than
          your wants.
        </p>
      </header>

      <SectionIntro section="prayer" depth={journey.sections.prayer} />

      <PrayerBoard initialOpen={open} initialAnswered={answered} />
    </div>
  );
}
