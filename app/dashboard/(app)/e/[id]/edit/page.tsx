import { notFound } from 'next/navigation';
import { getEventForEdit } from '../../../lead/actions';
import { PostForm } from '@/components/lead/PostForm';

/** Change or call off one event. Leaders of its group only. */
export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEventForEdit(id);
  if (!data) notFound();
  const { event, orgName } = data;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">{orgName}</p>
        <h2 className="font-display text-3xl font-light text-ivory">Change it</h2>
      </header>
      <PostForm
        mode="edit"
        eventId={event.id}
        orgs={[{ orgId: event.org_id, orgName }]}
        initial={{
          orgId: event.org_id,
          title: event.title,
          type: event.event_type,
          startsAtIso: event.starts_at,
          endsAtIso: event.ends_at,
          location: event.location,
          description: event.description,
          memberNote: event.member_note,
          leaderNote: event.leader_note,
          weeks: 1,
          bringItems: '',
          ridesEnabled: event.rides_enabled,
          seriesId: event.series_id,
        }}
      />
    </div>
  );
}
