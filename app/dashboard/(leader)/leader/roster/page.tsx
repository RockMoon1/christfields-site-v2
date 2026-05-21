import { getLeaderContext } from '@/lib/faithflow/leader-access';
import RosterPanel from '@/components/leader/RosterPanel';

export const metadata = {
  title: 'Roster | FaithFlow Leader',
};

export default async function RosterPage() {
  const ctx = await getLeaderContext();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-gold">
          Roster
        </p>
        <h1 className="font-display font-light text-3xl text-ivory md:text-4xl">
          {ctx?.orgName ? ctx.orgName : 'Your Group'}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ivory-dim">
          Invite the people you are walking with. You choose who is in the
          cohort.
        </p>
      </div>

      <RosterPanel hasGroup={Boolean(ctx)} orgName={ctx?.orgName ?? null} />
    </div>
  );
}
