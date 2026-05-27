'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getLeaderContext } from '@/lib/faithflow/leader-access';
import { getSupabase, type EventRow } from '@/lib/supabase';
import { isEventType } from '@/lib/dashboard/events';

/**
 * Leader/master event actions. Authorization runs through getLeaderContext: the
 * requester must hold a leader role (org:leader, org:master, org:admin) in the
 * organization currently active in their session, and every write is scoped to
 * that org. Masters qualify as leaders, so the same path covers both.
 */

export interface LeaderEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  goingCount: number;
  notGoingCount: number;
}

export type LeaderEventsResult =
  | { state: 'not-leader' }
  | { state: 'ready'; org: { id: string; name: string }; events: LeaderEvent[] };

export async function getLeaderEvents(): Promise<LeaderEventsResult> {
  const ctx = await getLeaderContext();
  if (!ctx) return { state: 'not-leader' };

  const sb = getSupabase();
  const { data, error } = await sb
    .from('events')
    .select('*')
    .eq('org_id', ctx.orgId)
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('getLeaderEvents failed', error);
    return { state: 'ready', org: { id: ctx.orgId, name: ctx.orgName }, events: [] };
  }

  const events = (data as EventRow[] | null) ?? [];
  let countsByEvent = new Map<string, { going: number; notGoing: number }>();

  if (events.length > 0) {
    const ids = events.map((e) => e.id);
    const { data: rsvpData, error: rsvpErr } = await sb
      .from('event_rsvps')
      .select('event_id, status')
      .in('event_id', ids);
    if (rsvpErr) console.error('getLeaderEvents: rsvp load failed', rsvpErr);
    const rsvps = (rsvpData as { event_id: string; status: string }[] | null) ?? [];
    countsByEvent = rsvps.reduce((map, r) => {
      const c = map.get(r.event_id) ?? { going: 0, notGoing: 0 };
      if (r.status === 'going') c.going += 1;
      else if (r.status === 'not_going') c.notGoing += 1;
      map.set(r.event_id, c);
      return map;
    }, new Map<string, { going: number; notGoing: number }>());
  }

  return {
    state: 'ready',
    org: { id: ctx.orgId, name: ctx.orgName },
    events: events.map((e) => {
      const c = countsByEvent.get(e.id) ?? { going: 0, notGoing: 0 };
      return {
        id: e.id,
        title: e.title,
        description: e.description || '',
        type: e.event_type,
        location: e.location || '',
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        goingCount: c.going,
        notGoingCount: c.notGoing,
      };
    }),
  };
}

export interface CreateEventInput {
  title: string;
  description: string;
  type: string;
  location: string;
  startsAt: string; // ISO string from the form
  endsAt?: string | null;
}

export async function createEvent(input: CreateEventInput): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getLeaderContext();
  if (!ctx) return { ok: false, error: 'You are not a leader of an active group.' };

  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Not signed in.' };

  const title = input.title.trim();
  if (!title) return { ok: false, error: 'Give the event a name.' };

  const start = new Date(input.startsAt);
  if (Number.isNaN(start.getTime())) return { ok: false, error: 'Pick a date and time.' };

  let endsAt: string | null = null;
  if (input.endsAt) {
    const end = new Date(input.endsAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) {
      endsAt = end.toISOString();
    }
  }

  const type = isEventType(input.type) ? input.type : 'gathering';

  const sb = getSupabase();
  const { error } = await sb.from('events').insert({
    org_id: ctx.orgId,
    created_by: userId,
    title: title.slice(0, 120),
    description: input.description.trim().slice(0, 600),
    event_type: type,
    location: input.location.trim().slice(0, 160),
    starts_at: start.toISOString(),
    ends_at: endsAt,
  });

  if (error) {
    console.error('createEvent failed', error);
    return { ok: false, error: 'Could not save the event. Please try again.' };
  }

  revalidatePath('/dashboard/leader/events');
  revalidatePath('/dashboard'); // members' banners refresh
  return { ok: true };
}

export async function deleteEvent(eventId: string): Promise<{ ok: boolean }> {
  const ctx = await getLeaderContext();
  if (!ctx) return { ok: false };

  const sb = getSupabase();
  const { error } = await sb.from('events').delete().eq('id', eventId).eq('org_id', ctx.orgId);
  if (error) {
    console.error('deleteEvent failed', error);
    return { ok: false };
  }

  revalidatePath('/dashboard/leader/events');
  revalidatePath('/dashboard');
  return { ok: true };
}
