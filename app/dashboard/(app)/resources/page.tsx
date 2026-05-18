import { getAreas } from '../progress/actions';
import { ResourceCard } from '@/components/dashboard/ResourceCard';

/**
 * Resources page. For each progress area, shows resources tailored to the
 * user's current score in that area. Three tiers:
 *
 *   1-3  Struggling   "I need help."
 *   4-7  Growing      "The humble middle."
 *   8-10 Leading      "I can help someone else here."
 *
 * Resources for presets are hand-written; custom areas use a generic but
 * personal template.
 */
export default async function ResourcesPage() {
  const areas = await getAreas();

  return (
    <div className="mx-auto max-w-5xl">
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
        </p>
      </header>

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
        <div className="flex flex-col gap-6">
          {areas.map((area) => (
            <ResourceCard key={area.id} area={area} />
          ))}
        </div>
      )}
    </div>
  );
}
