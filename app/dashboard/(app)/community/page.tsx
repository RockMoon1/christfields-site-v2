import { CommunityWall } from '@/components/dashboard/CommunityWall';
import { getCommunity } from './actions';

/**
 * The prayer wall. Shared across the community: share what you are walking
 * through, and tap "I prayed" for one another.
 */
export default async function CommunityPage() {
  const data = await getCommunity();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">We carry each other</p>
        <h1 className="font-display text-4xl font-light text-ivory">Prayer wall</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-silver">
          Share what you are walking through, and stand with others in theirs.
        </p>
        {data.totalPrayed > 0 && (
          <p className="mt-3 text-sm text-gold-lt">
            We have prayed for one another {data.totalPrayed.toLocaleString()} {data.totalPrayed === 1 ? 'time' : 'times'}.
          </p>
        )}
      </header>

      <CommunityWall initial={data.prayers} totalPrayed={data.totalPrayed} />
    </div>
  );
}
