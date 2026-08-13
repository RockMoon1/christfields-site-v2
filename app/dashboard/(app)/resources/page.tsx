import { getAreas } from '../progress/actions';
import { getAllJournalsByArea } from './actions';
import { ResourceCard } from '@/components/dashboard/ResourceCard';
import { ScrollTilt } from '@/components/dashboard/ScrollTilt';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { SectionIntro } from '@/components/dashboard/SectionIntro';
import { getJourney } from '@/lib/dashboard/journey-data';

/**
 * Resources page. For each progress area, shows resources tailored to the
 * user's current score plus a per-area reflection journal.
 *
 *   1-3  Struggling   "I need help."
 *   4-7  Growing      "The humble middle."
 *   8-10 Leading      "I can help someone else here."
 */
export default async function ResourcesPage() {
  // Fetch areas and ALL journals in parallel. The journals query returns
  // a Map keyed by area id so each card just pulls its own slice in O(1).
  const [areas, journalsByArea, journey] = await Promise.all([
    getAreas(),
    getAllJournalsByArea(),
    getJourney(),
  ]);

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Ambient morphing blobs behind the page, drift slowly. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <MorphBlob color="rgba(201, 165, 72, 0.05)" size={520} className="-left-32 top-32" />
        <MorphBlob color="rgba(45, 106, 79, 0.06)" size={460} className="-right-24 top-[60%]" />
      </div>

      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Right where you are
        </p>
        <h2 className="font-display text-4xl font-light text-ivory md:text-5xl">
          <em className="not-italic text-gold-lt">Resources.</em>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          What you see here changes based on where you are in each area. When you are
          struggling, this is where to start. When you are growing, this is what to ask
          of yourself. When you are ready to lead, this is how to bring others along.
          Reflect at the bottom of each card. Only you see what you write.
        </p>
      </header>

      <SectionIntro section="resources" depth={journey.sections.resources} />

      {areas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border-sub bg-black-3/40 p-12 text-center">
          <p className="font-display text-xl italic text-silver">
            Nothing to show yet.
          </p>
          <p className="mt-2 text-sm text-muted">
            Add some areas on the Progress page first, then come back here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {areas.map((area, i) => (
            <ScrollTilt key={area.id} index={i}>
              <ResourceCard
                area={area}
                journalEntries={journalsByArea.get(area.id) || []}
              />
            </ScrollTilt>
          ))}
        </div>
      )}
    </div>
  );
}
