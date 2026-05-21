import { RhythmBoard } from '@/components/dashboard/RhythmBoard';
import { getRhythms } from './actions';

/**
 * Rhythms page. Fetches the user's practices and logs server-side, then
 * hands them to the client RhythmBoard for interaction and animation.
 */
export default async function RhythmsPage() {
  const rhythms = await getRhythms();

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

      <RhythmBoard initialRhythms={rhythms} />
    </div>
  );
}
