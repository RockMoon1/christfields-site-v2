'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type EventRow, type EventRsvpStatus } from '@/lib/supabase';

/**
 * Member-facing event actions.
 *
 * A member sees events for every FaithFlow group (Clerk org) they belong to,
 * and can mark themselves going / not going. Authorization: the signed-in user
 * must belong to the event's org. Reads return safe defaults so the dashboard
 * always renders.
 */

export interface MemberEvent {
  id: string;
  orgId: string;
  title: string;
  description: string;
  type: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  myStatus: EventRsvpStatus | null;
  goingCount: number;
}

/** The Clerk org ids the signed-in user is a member of. */
async function myOrgIds(userId: string): Promise<string[]> {
  try {
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    return res.data.map((m) => m.organization.id);
  } catch (err) {
    console.error('myOrgIds failed', err);
    return [];
  }
}

/**
 * Upcoming events for the member's groups, soonest first. Includes events that
 * started within the last 12 hours so something happening "now" still shows.
 */
export async function getMyEvents(): Promise<MemberEvent[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const orgIds = await myOrgIds(userId);
    if (orgIds.length === 0) return [];

    const sb = getSupabase();
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from('events')
      .select('*')
      .in('org_id', orgIds)
      .gte('starts_at', since)
      .order('starts_at', { ascending: true })
      .limit(8);

    if (error) {
      console.error('getMyEvents: failed to load events', error);
      return [];
    }
    const events = (data as EventRow[] | null) ?? [];
    if (events.length === 0) return [];

    const ids = events.map((e) => e.id);
    const { data: rsvpData, error: rsvpErr } = await sb
      .from('event_rsvps')
      .select('event_id, clerk_user_id, status')
      .in('event_id', ids);

    if (rsvpErr) console.error('getMyEvents: failed to load rsvps', rsvpErr);

    const rsvps =
      (rsvpData as { event_id: string; clerk_user_id: string; status: EventRsvpStatus }[] | null) ??
      [];

    const goingByEvent = new Map<string, number>();
    const mineByEvent = new Map<string, EventRsvpStatus>();
    for (const r of rsvps) {
      if (r.status === 'going') {
        goingByEvent.set(r.event_id, (goingByEvent.get(r.event_id) ?? 0) + 1);
      }
      if (r.clerk_user_id === userId) mineByEvent.set(r.event_id, r.status);
    }

    return events.map((e) => ({
      id: e.id,
      orgId: e.org_id,
      title: e.title,
      description: e.description || '',
      type: e.event_type,
      location: e.location || '',
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      myStatus: mineByEvent.get(e.id) ?? null,
      goingCount: goingByEvent.get(e.id) ?? 0,
    }));
  } catch (err) {
    console.error('getMyEvents: unexpected failure', err);
    return [];
  }
}

/** Mark the signed-in member going / not going for an event in their group. */
export async function setEventRsvp(
  eventId: string,
  status: EventRsvpStatus,
): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    if (status !== 'going' && status !== 'not_going') return { ok: false };

    const sb = getSupabase();

    // The member may only RSVP to an event in an org they belong to.
    const { data: ev, error: evErr } = await sb
      .from('events')
      .select('org_id')
      .eq('id', eventId)
      .maybeSingle();
    if (evErr || !ev) return { ok: false };

    const orgIds = await myOrgIds(userId);
    if (!orgIds.includes((ev as { org_id: string }).org_id)) return { ok: false };

    const { error } = await sb.from('event_rsvps').upsert(
      {
        event_id: eventId,
        clerk_user_id: userId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,clerk_user_id' },
    );
    if (error) {
      console.error('setEventRsvp failed', error);
      return { ok: false };
    }

    revalidatePath('/dashboard');
    return { ok: true };
  } catch (err) {
    console.error('setEventRsvp: unexpected failure', err);
    return { ok: false };
  }
}
