import { getGroupAvailability } from './actions';
import { PlanBoard } from '@/components/leader/PlanBoard';

/**
 * Leader/master planning page. A free/busy heatmap of the group's availability
 * so a leader can pick the best time to gather. Authorization lives in the
 * action (getGroupAvailability requires a leader role in the active org).
 */
export default async function LeaderPlanPage() {
  const data = await getGroupAvailability();

  if (data.state === 'not-leader') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Plan</p>
          <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
            Choose your group
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-silver">
            Use the switcher in the top right to pick the group you lead. Then you can see when
            everyone is free and plan around it.
          </p>
        </div>
      </div>
    );
  }

  if (data.state === 'no-members') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Plan</p>
          <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">{data.org.name}</h1>
          <p className="max-w-md text-sm leading-relaxed text-silver">
            Invite the people you are walking with first. Once they are in the group and set their
            availability, the best times to gather will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Plan</p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">When to gather</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-silver">
          See when {data.org.name} is free, then create an event at a time that works for the most
          people. You only see free or busy, never anyone&rsquo;s private details.
        </p>
      </header>

      <PlanBoard total={data.total} days={data.days} best={data.best} />
    </div>
  );
}
