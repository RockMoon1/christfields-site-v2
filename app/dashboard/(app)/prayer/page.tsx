import { PrayerBoard } from '@/components/dashboard/PrayerBoard';
import { getPrayers } from './actions';

/**
 * Prayer page. Fetches the signed-in user's open and answered requests
 * server-side and passes them as initial data to the client PrayerBoard.
 */
export default async function PrayerPage() {
  const { open, answered } = await getPrayers();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Bring it to God
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Prayer
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          Keep your requests here, and look back at what he has answered.
        </p>
      </header>

      <PrayerBoard initialOpen={open} initialAnswered={answered} />
    </div>
  );
}
