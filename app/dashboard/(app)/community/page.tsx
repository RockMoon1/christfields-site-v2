import { CommunityWall } from '@/components/dashboard/CommunityWall';
import { getCommunity } from './actions';

/**
 * Community page. Fetches the shared prayer wall server-side and hands
 * the data to the client wall for interaction.
 *
 * "Bear one another's burdens, and so fulfill the law of Christ."
 * Galatians 6:2
 */
export default async function CommunityPage() {
  const data = await getCommunity();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          We carry each other
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Community
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          This is not a place to get prayers answered faster. It is the body of Christ doing what
          it is made for: bearing one another&rsquo;s burdens, praying for each other, and showing
          up. Share what you are walking through, and stand with others in theirs.
        </p>
        {data.totalPrayed > 0 && (
          <p className="mt-3 text-sm text-gold-lt">
            We have prayed for one another {data.totalPrayed.toLocaleString()}{' '}
            {data.totalPrayed === 1 ? 'time' : 'times'}.
          </p>
        )}
      </header>

      <CommunityWall initial={data.prayers} totalPrayed={data.totalPrayed} />
    </div>
  );
}
