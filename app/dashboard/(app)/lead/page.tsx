import Link from 'next/link';
import { getLeadOverview } from './actions';
import { ThisWeek } from '@/components/lead/ThisWeek';

/** Lead: the fifteen-minute screen. One card per group you lead. */
export default async function LeadPage() {
  const overview = await getLeadOverview();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Lead</p>
          <h2 className="font-display text-3xl font-light text-ivory">This week</h2>
        </div>
        <Link
          href="/dashboard/lead/post"
          className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
        >
          Post something
        </Link>
      </header>

      {overview.groups.length === 0 ? (
        <p className="text-sm text-silver">You are not leading a group yet.</p>
      ) : (
        <div className="space-y-6">
          {overview.groups.map((g) => (
            <ThisWeek key={g.orgId} group={g} tz={overview.tz} />
          ))}
        </div>
      )}
    </div>
  );
}
