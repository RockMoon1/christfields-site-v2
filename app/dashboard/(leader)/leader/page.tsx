import Link from 'next/link';
import { getGroupData } from './actions';
import { GroupOverview } from '@/components/leader/GroupOverview';

export default async function LeaderPage() {
  const data = await getGroupData();

  if (data.state === 'not-leader') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Group
          </p>
          <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
            Choose your group
          </h1>
          <p className="max-w-md text-sm text-silver leading-relaxed">
            Use the switcher in the top right to pick an existing group or create a new one.
            Once you are set as a leader, this page will come to life.
          </p>
        </div>
      </div>
    );
  }

  if (data.state === 'no-members') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Group
          </p>
          <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
            {data.org.name}
          </h1>
          <p className="max-w-md text-sm text-silver leading-relaxed">
            Your group is set up. Now invite the people you are walking with.
          </p>
          <Link
            href="/dashboard/leader/roster"
            className="mt-2 inline-flex items-center gap-2 rounded-sm border border-gold/45 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Go to roster
          </Link>
        </div>
      </div>
    );
  }

  const { org, members, group } = data;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Group
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          {org.name}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-silver leading-relaxed">
          A gentle look at where your group is, so you can shepherd them well this season.
        </p>
      </header>

      <GroupOverview org={org} members={members} group={group} />
    </div>
  );
}
