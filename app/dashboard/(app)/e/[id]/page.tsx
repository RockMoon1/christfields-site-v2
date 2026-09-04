import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEvent } from '../../events/actions';
import { getLeaderEvent } from '../../lead/actions';
import { EventCard } from '@/components/dashboard/EventCard';
import { SlotList } from '@/components/dashboard/SlotList';
import { Starters } from '@/components/dashboard/Starters';
import { PlanQuestion } from '@/components/dashboard/PlanQuestion';
import { LeaderStrip } from '@/components/lead/LeaderStrip';
import { FromTheWord } from '@/components/dashboard/FromTheWord';
import { whenInWords } from '@/lib/dashboard/format';
import { googleTemplateUrl } from '@/lib/schedule/ics-export';
import { appUrl } from '@/lib/dashboard/prefs';
import { getMemberTimeZone } from '@/lib/dashboard/timezone-server';
import { auth } from '@clerk/nextjs/server';
import { mintIcsToken } from '@/lib/notify/tokens';

/**
 * Everything about one thing, and the deep-link target of every notification.
 * Members see the card, bring/rides if the leader turned them on, and after
 * they answer, two things to ask someone. Leaders of this group also see the
 * leader strip underneath.
 */
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, tz, { userId }] = await Promise.all([getEvent(id), getMemberTimeZone(), auth()]);
  if (!event) notFound();
  const icsToken = userId ? mintIcsToken(event.id, userId, event.startsAt) : undefined;
  const zone = tz && tz !== 'UTC' ? tz : event.tz;
  const whenText = whenInWords(event.startsAt, zone);
  const answered = event.myStatus === 'going' || event.myStatus === 'maybe';
  const leaderView = event.canLead ? await getLeaderEvent(id) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="mb-4 inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-silver">
        &larr; Home
      </Link>

      <EventCard
        event={event}
        whenText={whenText}
        googleUrl={googleTemplateUrl(event, appUrl())}
        icsToken={icsToken}
        big
        linkToEvent={false}
      />

      <div className="mt-6 space-y-6">
        {event.status === 'scheduled' && <FromTheWord event={event} />}

        {answered && event.withinDay && event.status === 'scheduled' && (
          <PlanQuestion eventId={event.id} initial={event.myPlan} />
        )}

        {event.status === 'scheduled' && (
          <SlotList eventId={event.id} slots={event.slots} ridesEnabled={event.ridesEnabled} />
        )}

        {answered && event.status === 'scheduled' && <Starters note={event.memberNote} />}

        {leaderView && <LeaderStrip view={leaderView} whenText={whenText} />}
      </div>
    </div>
  );
}
