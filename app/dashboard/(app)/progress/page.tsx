import { ProgressBoard } from '@/components/dashboard/ProgressBoard';
import { SectionIntro } from '@/components/dashboard/SectionIntro';
import { getAreas } from './actions';
import { getJourney } from '@/lib/dashboard/journey-data';
import { PROGRESS_GOALS_NOTE } from '@/lib/dashboard/foundations';

/**
 * Progress page. Fetches the signed-in user's areas + entries server-side and
 * hands them to the client ProgressBoard for rendering and interaction.
 */
export default async function ProgressPage() {
  const [areas, journey] = await Promise.all([getAreas(), getJourney()]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Self-tracked
        </p>
        <h2 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Your <em className="not-italic text-gold-lt">progress.</em>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          Add the areas you are working on. Score each one when you feel it has shifted. The
          point is honesty over time, not perfect numbers.
        </p>
      </header>

      <SectionIntro section="progress" depth={journey.sections.progress} />

      {/* People read the preset goal numbers (8, 8, 7, 7) as real scores, or
          even as someone else's data leaking in. They are just example targets,
          so we explain it plainly right above the cards. */}
      <section className="mb-8 rounded-sm border border-border-sub bg-black-3/60 p-5">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          {PROGRESS_GOALS_NOTE.title}
        </p>
        <div className="max-w-2xl space-y-2 text-sm leading-relaxed text-silver">
          {PROGRESS_GOALS_NOTE.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <ProgressBoard initialAreas={areas} />
    </div>
  );
}
