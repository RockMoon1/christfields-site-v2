import { ReflectPanel } from '@/components/dashboard/ReflectPanel';
import { SectionIntro } from '@/components/dashboard/SectionIntro';
import { getTodayReflect, getThoughtRecords } from './actions';
import { getJourney } from '@/lib/dashboard/journey-data';

/**
 * Reflect page. Fetches today's check-in data server-side and passes it to
 * the client ReflectPanel for interaction.
 */
export default async function ReflectPage() {
  const [today, reframes, journey] = await Promise.all([
    getTodayReflect(),
    getThoughtRecords(),
    getJourney(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          A few honest minutes
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Reflect
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          Check in with yourself and with God. Be honest. There is grace here.
        </p>
      </header>

      <SectionIntro section="reflect" depth={journey.sections.reflect} />

      <ReflectPanel today={today} reframes={reframes} />
    </div>
  );
}
