import Link from 'next/link';
import { getGroupData } from '../actions';
import { MembersBoard } from '@/components/leader/MembersBoard';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const data = await getGroupData();

  if (data.state === 'not-leader') {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader />
        <div className="mt-20 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-2xl font-light text-ivory-dim">
            You are not leading a small group yet.
          </p>
          <p className="max-w-md text-sm text-silver">
            Use the group switcher in the top right to choose your small group. Once you have
            one, your members will appear here.
          </p>
        </div>
      </div>
    );
  }

  if (data.state === 'no-members') {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader />
        <div className="mt-20 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-2xl font-light text-ivory-dim">
            {data.org.name} has no members yet.
          </p>
          <p className="max-w-md text-sm text-silver">
            Head to the roster to invite people. Once they join, their journey summaries will
            appear here for you to walk alongside them.
          </p>
          <Link
            href="/dashboard/leader/roster"
            className="mt-2 rounded-sm border border-border-gold bg-gold/[0.07] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-gold-lt transition-colors hover:bg-gold/[0.14]"
          >
            Go to roster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader />
      <MembersBoard members={data.members} />
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-8">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        Members
      </p>
      <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">Your people.</h1>
      <p className="mt-2 max-w-xl text-sm text-silver">
        Select someone below to see where they are in their walk. Let this be a starting point
        for prayer, not a report card.
      </p>
    </div>
  );
}
