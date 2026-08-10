import { getLeaderEvents } from './actions';
import { EventManager } from '@/components/leader/EventManager';

/**
 * Leader events page. Create events that appear as an animated banner on
 * every member's dashboard, and see who is going. Authorization lives in the
 * action layer (getLeaderEvents requires a leader role in the active org).
 */
export default async function LeaderEventsPage() {
  const data = await getLeaderEvents();

  if (data.state === 'not-leader') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Events</p>
          <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
            Choose your small group
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-silver">
            Use the switcher in the top right to pick the small group you lead. Then you can
            create events that light up everyone&rsquo;s dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Events</p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Draw everyone in
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-silver">
          Create an event for {data.org.name}. It appears as a moving, lit-up banner on every
          member&rsquo;s dashboard, and they can mark whether they are coming.
        </p>
      </header>

      <EventManager initialEvents={data.events} orgName={data.org.name} />
    </div>
  );
}
