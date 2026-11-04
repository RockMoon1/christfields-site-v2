import Link from 'next/link';
import { getLeadOverview } from './actions';
import { ThisWeek } from '@/components/lead/ThisWeek';
import { isFormsOrganizer } from '@/lib/forms/server';

/** Lead: the fifteen-minute screen. One card per group you lead. */
export default async function LeadPage() {
  const overview = await getLeadOverview();
  const organizer = await isFormsOrganizer();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Lead</p>
          <h1 className="font-display text-3xl font-light text-ivory">This week</h1>
        </div>
        <Link
          href="/dashboard/lead/post"
          className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
        >
          Post something
        </Link>
      </header>

      {organizer && <Link href="/dashboard/forms" className="mb-6 block rounded-lg border border-gold/40 p-5 text-gold">Iron and Ember public forms &amp; responses →</Link>}
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
