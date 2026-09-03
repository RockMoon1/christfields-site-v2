import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ledOrgs } from '@/lib/groups/membership';
import { SLOT_DEFAULT_HOUR, isSlot } from '@/lib/dashboard/availability';
import { getEventForEdit } from '../actions';
import { PostForm } from '@/components/lead/PostForm';

/**
 * Post something. Five visible fields, one collapsed More, two buttons.
 * Arriving from a best-time card prefills the day and time; arriving from
 * "Extend?" prefills everything from the last occurrence of a series.
 */
export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; date?: string; slot?: string; extend?: string }>;
}) {
  const sp = await searchParams;
  const orgs = await ledOrgs();
  if (orgs.length === 0) redirect('/dashboard');

  const defaultOrg = orgs.find((o) => o.orgId === sp.org)?.orgId ?? orgs[0].orgId;

  let startsAtLocal = '';
  if (sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.slot && isSlot(sp.slot)) {
    const h = SLOT_DEFAULT_HOUR[sp.slot];
    startsAtLocal = `${sp.date}T${h < 10 ? `0${h}` : h}:00`;
  }

  let extend: Awaited<ReturnType<typeof getEventForEdit>> = null;
  if (sp.extend) extend = await getEventForEdit(sp.extend);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/lead" className="mb-4 inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-silver">
        &larr; Lead
      </Link>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-light text-ivory">Post something</h2>
        <p className="mt-1 text-sm text-silver">Under a minute. Everyone in the group hears about it.</p>
      </header>
      <PostForm
        mode="create"
        orgs={orgs.map((o) => ({ orgId: o.orgId, orgName: o.orgName }))}
        initial={{
          orgId: extend?.event.org_id ?? defaultOrg,
          title: extend?.event.title ?? '',
          type: extend?.event.event_type ?? 'gathering',
          startsAtIso: extend ? new Date(new Date(extend.event.starts_at).getTime() + 7 * 86_400_000).toISOString() : null,
          startsAtLocal,
          endsAtIso: extend?.event.ends_at ?? null,
          location: extend?.event.location ?? '',
          description: extend?.event.description ?? '',
          memberNote: extend?.event.member_note ?? '',
          leaderNote: extend?.event.leader_note ?? '',
          weeks: extend ? 6 : 1,
          bringItems: '',
          ridesEnabled: extend?.event.rides_enabled ?? false,
          seriesId: null,
        }}
      />
    </div>
  );
}
