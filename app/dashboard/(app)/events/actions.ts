'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  getSupabase,
  type EventRow,
  type EventRsvpRow,
  type EventRsvpStatus,
  type EventSlotRow,
  type EventSlotClaimRow,
  type EventChangeRow,
} from '@/lib/supabase';
import { getMyMemberships, assertMemberOf, ledOrgs } from '@/lib/groups/membership';
import {
  toMemberEvent,
  toFaces,
  type MemberEvent,
  type RsvpFace,
  type MemberSlot,
} from '@/lib/schedule/public-event';
import { ensureMemberPrefs } from '@/lib/dashboard/prefs';
import { getMemberTimeZone } from '@/lib/dashboard/timezone-server';
import { dayKeyInZone } from '@/lib/dashboard/timezone';
import { whenInWords } from '@/lib/dashboard/format';
import { questionForWeek, weekKey } from '@/lib/dashboard/questions';
import { lastSeenByMember, nudgeDue, RHYTHM_DAYS } from '@/lib/dashboard/rhythm';
import { isEncryptionConfigured } from '@/lib/security/crypto';

/**
 * Member-facing schedule actions.
 *
 * A member sees events for every group (Clerk org) they belong to and answers
 * with one of three states. Every read filters by the member's own org ids;
 * every write re-checks membership of the event's org. Payloads are built
 * through toMemberEvent() so leader-only fields never reach a browser. Reads
 * return safe defaults so Home always renders.
 */

const WEEKS_AHEAD = 6;
const GRACE_MS = 12 * 60 * 60 * 1000;
const FIRST_TIME_WINDOW_MS = 30 * 86_400_000;
const CANCELLED_VISIBLE_MS = 48 * 60 * 60 * 1000;

export interface FeedEvent extends MemberEvent {
  myStatus: EventRsvpStatus | null;
  faces: RsvpFace[];
  going: number;
  maybe: number;
}

export interface ChangedLine {
  eventId: string;
  title: string;
  kind: 'changed' | 'cancelled';
  summary: string;
  at: string;
}

export type HomeSlotCard =
  | { kind: 'hello'; orgName: string }
  | { kind: 'recently'; eventId: string; title: string; thanks: string }
  | { kind: 'rhythm'; eventId: string; title: string; when: string }
  | { kind: 'quiet'; question: string; weekKey: string }
  | { kind: 'free' }
  | { kind: 'install' }
  | { kind: 'push' };

export interface HomeFeed {
  tz: string;
  firstName: string;
  isLeader: boolean;
  multiOrg: boolean;
  changed: ChangedLine[];
  next: FeedEvent | null;
  later: FeedEvent[];
  slot: HomeSlotCard | null;
  /** The theme of a reflection kept today, so Home can show a verse that fits. */
  todayTheme: string | null;
}

const EMPTY_FEED: HomeFeed = {
  tz: 'UTC',
  firstName: 'friend',
  isLeader: false,
  multiOrg: false,
  changed: [],
  next: null,
  later: [],
  slot: null,
  todayTheme: null,
};

function orgNameMap(memberships: { orgId: string; orgName: string }[]): Map<string, string> {
  return new Map(memberships.map((m) => [m.orgId, m.orgName]));
}

async function loadRsvps(eventIds: string[]): Promise<EventRsvpRow[]> {
  if (eventIds.length === 0) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from('event_rsvps')
    .select('*')
    .in('event_id', eventIds)
    .order('updated_at', { ascending: true });
  if (error) {
    console.error('loadRsvps failed', error);
    return [];
  }
  return (data as EventRsvpRow[] | null) ?? [];
}

function decorate(row: EventRow, orgName: string, rsvps: EventRsvpRow[], userId: string): FeedEvent {
  const mine = rsvps.filter((r) => r.event_id === row.id);
  const faces = toFaces(mine);
  return {
    ...toMemberEvent(row, orgName),
    myStatus: mine.find((r) => r.clerk_user_id === userId)?.status ?? null,
    faces,
    going: faces.filter((f) => f.status === 'going').length,
    maybe: faces.filter((f) => f.status === 'maybe').length,
  };
}

export async function getHomeFeed(): Promise<HomeFeed> {
  try {
    const { userId } = await auth();
    if (!userId) return EMPTY_FEED;

    const [memberships, prefs, user, tz] = await Promise.all([
      getMyMemberships(),
      ensureMemberPrefs(userId),
      currentUser(),
      getMemberTimeZone(),
    ]);
    const firstName = user?.firstName || user?.username || 'friend';
    const isLeader = memberships.some((m) => m.isLeader);
    const orgIds = memberships.map((m) => m.orgId);
    if (orgIds.length === 0) return { ...EMPTY_FEED, tz, firstName, isLeader };

    const names = orgNameMap(memberships);
    const sb = getSupabase();
    const now = Date.now();
    const since = new Date(now - GRACE_MS).toISOString();
    const until = new Date(now + WEEKS_AHEAD * 7 * 86_400_000).toISOString();
    const weekAgo = new Date(now - 7 * 86_400_000).toISOString();

    const [eventsRes, changesRes, myRsvpRes, weeklyRes, quietRes, seenRes, todayRes, pastRes] = await Promise.all([
      sb
        .from('events')
        .select('*')
        .in('org_id', orgIds)
        .gte('starts_at', since)
        .lte('starts_at', until)
        .order('starts_at', { ascending: true })
        .limit(60),
      sb
        .from('event_changes')
        .select('*')
        .in('org_id', orgIds)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })
        .limit(20),
      sb.from('event_rsvps').select('event_id', { count: 'exact', head: true }).eq('clerk_user_id', userId),
      sb.from('availability_weekly').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId),
      sb
        .from('quiet_reflections')
        .select('id', { count: 'exact', head: true })
        .eq('clerk_user_id', userId)
        .gte('created_at', new Date(now - 7 * 86_400_000).toISOString()),
      // Where this member was last seen: marked present, or said yes to something that has happened.
      Promise.all([
        sb
          .from('event_attendance')
          .select('clerk_user_id, event_id')
          .eq('clerk_user_id', userId)
          .eq('present', true)
          .order('marked_at', { ascending: false })
          .limit(60),
        sb
          .from('event_rsvps')
          .select('clerk_user_id, event_id')
          .eq('clerk_user_id', userId)
          .eq('status', 'going')
          .order('updated_at', { ascending: false })
          .limit(60),
      ]),
      // Today's confirmed reflection, if any, for the verse on Home.
      sb
        .from('quiet_reflections')
        .select('themes')
        .eq('clerk_user_id', userId)
        .eq('confirmed', true)
        .eq('safety', false)
        .gte('created_at', new Date(now - 24 * 3_600_000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Has any of this member's groups met yet? If not, nobody can be "away".
      sb
        .from('events')
        .select('id', { count: 'exact', head: true })
        .in('org_id', orgIds)
        .eq('status', 'scheduled')
        .lt('starts_at', new Date(now).toISOString()),
    ]);

    if (eventsRes.error) console.error('getHomeFeed: events failed', eventsRes.error);

    const rows = ((eventsRes.data as EventRow[] | null) ?? []).filter((e) => {
      if (e.status !== 'cancelled') return true;
      const cancelledAt = e.cancelled_at ? Date.parse(e.cancelled_at) : 0;
      return now - cancelledAt < CANCELLED_VISIBLE_MS;
    });
    const rsvps = await loadRsvps(rows.map((e) => e.id));
    const events = rows.map((e) => decorate(e, names.get(e.org_id) ?? 'Our group', rsvps, userId));

    const changes = (changesRes.data as EventChangeRow[] | null) ?? [];
    const titleById = new Map(rows.map((e) => [e.id, e.title]));
    const missingIds = changes.map((c) => c.event_id).filter((id) => !titleById.has(id));
    if (missingIds.length > 0) {
      const { data } = await sb.from('events').select('id, title').in('id', missingIds);
      for (const e of (data as { id: string; title: string }[] | null) ?? []) titleById.set(e.id, e.title);
    }
    const changed: ChangedLine[] = changes
      .filter((c) => c.kind === 'changed' || c.kind === 'cancelled')
      .slice(0, 5)
      .map((c) => ({
        eventId: c.event_id,
        title: titleById.get(c.event_id) ?? 'An event',
        kind: c.kind as 'changed' | 'cancelled',
        summary: c.summary,
        at: c.created_at,
      }));

    const hasAnswered = (myRsvpRes.count ?? 0) > 0;
    const hasAvailability = (weeklyRes.count ?? 0) > 0;
    const thanks = changes.find((c) => c.kind === 'thanks');
    const upcoming = events.filter((e) => e.status === 'scheduled');
    const cancelledRecent = events.filter((e) => e.status === 'cancelled');
    const [next, ...later] = upcoming;

    // The two-week rhythm: seen = present, or a yes to something that has happened.
    const [attRows, goingRows] = seenRes;
    const seenEventIds = Array.from(
      new Set([
        ...(((attRows.data as { event_id: string }[] | null) ?? []).map((r) => r.event_id)),
        ...(((goingRows.data as { event_id: string }[] | null) ?? []).map((r) => r.event_id)),
      ]),
    );
    // Only gatherings that actually happened count; a yes to something later called off does not.
    const eventStarts = new Map<string, string>(rows.filter((e) => e.status === 'scheduled').map((e) => [e.id, e.starts_at]));
    const missingStarts = seenEventIds.filter((id) => !eventStarts.has(id));
    let seenLookupFailed = !!attRows.error || !!goingRows.error;
    if (missingStarts.length > 0) {
      const { data, error } = await sb.from('events').select('id, starts_at').in('id', missingStarts).eq('status', 'scheduled');
      if (error) seenLookupFailed = true;
      for (const e of (data as { id: string; starts_at: string }[] | null) ?? []) eventStarts.set(e.id, e.starts_at);
    }
    const lastSeen = lastSeenByMember({
      attendance: (attRows.data as { clerk_user_id: string; event_id: string }[] | null) ?? [],
      going: (goingRows.data as { clerk_user_id: string; event_id: string }[] | null) ?? [],
      eventStarts,
      nowMs: now,
    }).get(userId);
    const joinedMs = Math.min(...memberships.map((m) => m.joinedAtMs || now));
    const cutoff = now - RHYTHM_DAYS * 86_400_000;
    const groupHasMet = (pastRes.count ?? 0) > 0;
    const awayAWhile = groupHasMet && !seenLookupFailed && joinedMs < cutoff && (lastSeen === undefined || lastSeen < cutoff);
    // Leaders run the room; the card is for members, and only about an event they have not answered.
    const rhythmDue = !isLeader && !!next && next.myStatus === null && awayAWhile && nudgeDue(prefs.rhythm_nudged_at ?? null, now);
    const todayTheme = ((todayRes.data as { themes: string[] } | null)?.themes ?? [])[0] ?? null;

    const dayKey = dayKeyInZone(tz && tz !== 'UTC' ? tz : 'America/Denver');
    const quietDue = hasAnswered && isEncryptionConfigured() && (quietRes.count ?? 0) === 0;

    let slot: HomeSlotCard | null = null;
    if (!prefs.hello_seen) slot = { kind: 'hello', orgName: memberships[0]?.orgName ?? 'our group' };
    else if (thanks) {
      slot = {
        kind: 'recently',
        eventId: thanks.event_id,
        title: titleById.get(thanks.event_id) ?? 'Last time',
        thanks: thanks.summary,
      };
    } else if (rhythmDue && next) {
      slot = { kind: 'rhythm', eventId: next.id, title: next.title, when: whenInWords(next.startsAt, tz && tz !== 'UTC' ? tz : next.tz, now) };
    } else if (quietDue) slot = { kind: 'quiet', question: questionForWeek(dayKey).text, weekKey: weekKey(dayKey) };
    else if (!prefs.free_nudge_seen && hasAnswered && !hasAvailability) slot = { kind: 'free' };
    else if (!prefs.install_nudge_seen && hasAnswered) slot = { kind: 'install' };
    else if (!prefs.push_primer_seen && hasAnswered) slot = { kind: 'push' };

    return {
      tz,
      firstName,
      isLeader,
      multiOrg: orgIds.length > 1,
      changed,
      next: next ?? null,
      later: [...later, ...cancelledRecent],
      slot,
      todayTheme,
    };
  } catch (err) {
    console.error('getHomeFeed failed', err);
    return EMPTY_FEED;
  }
}

/* ============================================================
   One event.
   ============================================================ */

export interface EventDetail extends FeedEvent {
  slots: MemberSlot[];
  myPlan: string;
  canLead: boolean;
  /** True within 24 hours of start: the plan question shows. */
  withinDay: boolean;
}

async function loadSlots(eventId: string, userId: string): Promise<MemberSlot[]> {
  const sb = getSupabase();
  const { data: slotRows, error } = await sb
    .from('event_slots')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error || !slotRows || slotRows.length === 0) return [];
  const slots = slotRows as EventSlotRow[];
  const { data: claimRows } = await sb
    .from('event_slot_claims')
    .select('*')
    .in('slot_id', slots.map((s) => s.id));
  const claims = (claimRows as EventSlotClaimRow[] | null) ?? [];
  return slots.map((s) => {
    const mine = claims.filter((c) => c.slot_id === s.id);
    return {
      id: s.id,
      kind: s.kind,
      label: s.label,
      capacity: s.capacity,
      claims: mine.map((c) => ({ displayName: c.display_name, qty: c.qty, mine: c.clerk_user_id === userId })),
      taken: mine.reduce((n, c) => n + c.qty, 0),
    };
  });
}

export async function getEvent(id: string): Promise<EventDetail | null> {
  try {
    const { userId } = await auth();
    if (!userId || !id) return null;
    const sb = getSupabase();
    const { data, error } = await sb.from('events').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    const row = data as EventRow;
    if (!(await assertMemberOf(row.org_id))) return null;

    const memberships = await getMyMemberships();
    const orgName = memberships.find((m) => m.orgId === row.org_id)?.orgName ?? 'Our group';
    const [rsvps, slots, led] = await Promise.all([loadRsvps([row.id]), loadSlots(row.id, userId), ledOrgs()]);
    const base = decorate(row, orgName, rsvps, userId);
    const startMs = new Date(row.starts_at).getTime();
    return {
      ...base,
      slots,
      myPlan: rsvps.find((r) => r.clerk_user_id === userId)?.plan ?? '',
      canLead: led.some((o) => o.orgId === row.org_id),
      withinDay: startMs - Date.now() < 24 * 60 * 60 * 1000,
    };
  } catch (err) {
    console.error('getEvent failed', err);
    return null;
  }
}

/* ============================================================
   Answers.
   ============================================================ */

function isRsvpStatus(v: string): v is EventRsvpStatus {
  return v === 'going' || v === 'maybe' || v === 'not_going';
}

/**
 * The one-tap answer. Snapshots the first name and photo so faces render with
 * zero Clerk calls, and sets the leader-only first-timer flag when this is a
 * new member's first yes in that group.
 */
export async function setRsvp(eventId: string, status: string): Promise<{ ok: boolean; faces?: RsvpFace[] }> {
  try {
    const { userId } = await auth();
    if (!userId || !isRsvpStatus(status)) return { ok: false };

    const sb = getSupabase();
    const { data: ev } = await sb.from('events').select('id, org_id, status').eq('id', eventId).maybeSingle();
    if (!ev) return { ok: false };
    const event = ev as { id: string; org_id: string; status: string };
    if (event.status !== 'scheduled') return { ok: false };
    if (!(await assertMemberOf(event.org_id))) return { ok: false };

    const [user, memberships] = await Promise.all([currentUser(), getMyMemberships()]);
    const displayName = user?.firstName || user?.username || 'Member';
    const imageUrl = user?.imageUrl || '';

    let firstTime = false;
    if (status !== 'not_going') {
      const membership = memberships.find((m) => m.orgId === event.org_id);
      const youngMembership = !!membership && Date.now() - membership.joinedAtMs < FIRST_TIME_WINDOW_MS;
      if (youngMembership) {
        const { data: seen } = await sb
          .from('org_member_seen')
          .select('clerk_user_id')
          .eq('org_id', event.org_id)
          .eq('clerk_user_id', userId)
          .maybeSingle();
        firstTime = !seen;
      }
    }

    const { error } = await sb.from('event_rsvps').upsert(
      {
        event_id: eventId,
        clerk_user_id: userId,
        status,
        display_name: displayName.slice(0, 60),
        image_url: imageUrl.slice(0, 500),
        first_time: firstTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,clerk_user_id' },
    );
    if (error) {
      console.error('setRsvp failed', error);
      return { ok: false };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/e/${eventId}`);
    const faces = toFaces(await loadRsvps([eventId]));
    return { ok: true, faces };
  } catch (err) {
    console.error('setRsvp failed', err);
    return { ok: false };
  }
}

const PLANS = new Set(['after_work', 'hour_before', 'unsure', '']);

/** The one plan question. Private to the member; echoed back only to them. */
export async function setPlan(eventId: string, plan: string): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId || !PLANS.has(plan)) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb
      .from('event_rsvps')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('clerk_user_id', userId);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/* ============================================================
   Bring-something and rides.
   ============================================================ */

async function slotEvent(slotId: string): Promise<{ eventId: string; orgId: string; capacity: number } | null> {
  const sb = getSupabase();
  const { data } = await sb.from('event_slots').select('id, event_id, capacity').eq('id', slotId).maybeSingle();
  if (!data) return null;
  const slot = data as { event_id: string; capacity: number };
  const { data: ev } = await sb.from('events').select('org_id, status').eq('id', slot.event_id).maybeSingle();
  const event = ev as { org_id: string; status: string } | null;
  if (!event || event.status !== 'scheduled') return null;
  return { eventId: slot.event_id, orgId: event.org_id, capacity: slot.capacity };
}

export async function claimSlot(slotId: string, qty: number = 1): Promise<{ ok: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const info = await slotEvent(slotId);
    if (!info || !(await assertMemberOf(info.orgId))) return { ok: false };
    const n = Math.max(1, Math.min(6, Math.floor(qty) || 1));

    const sb = getSupabase();
    const { data: claims } = await sb.from('event_slot_claims').select('clerk_user_id, qty').eq('slot_id', slotId);
    const taken = ((claims as { clerk_user_id: string; qty: number }[] | null) ?? [])
      .filter((c) => c.clerk_user_id !== userId)
      .reduce((s, c) => s + c.qty, 0);
    if (taken + n > info.capacity) return { ok: false, error: 'That one is already taken.' };

    const user = await currentUser();
    const { error } = await sb.from('event_slot_claims').upsert(
      {
        slot_id: slotId,
        clerk_user_id: userId,
        display_name: (user?.firstName || user?.username || 'Member').slice(0, 60),
        qty: n,
      },
      { onConflict: 'slot_id,clerk_user_id' },
    );
    if (error) return { ok: false, error: 'Could not save that. Try again.' };
    revalidatePath(`/dashboard/e/${info.eventId}`);
    return { ok: true };
  } catch (err) {
    console.error('claimSlot failed', err);
    return { ok: false };
  }
}

export async function unclaimSlot(slotId: string): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const info = await slotEvent(slotId);
    if (!info) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb.from('event_slot_claims').delete().eq('slot_id', slotId).eq('clerk_user_id', userId);
    revalidatePath(`/dashboard/e/${info.eventId}`);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/** A member offers a ride: a ride slot with N seats, labelled with their name. */
export async function offerRide(eventId: string, seats: number, from: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const sb = getSupabase();
    const { data: ev } = await sb.from('events').select('org_id, status, rides_enabled').eq('id', eventId).maybeSingle();
    const event = ev as { org_id: string; status: string; rides_enabled: boolean } | null;
    if (!event || event.status !== 'scheduled' || !event.rides_enabled) return { ok: false };
    if (!(await assertMemberOf(event.org_id))) return { ok: false };

    const n = Math.max(1, Math.min(8, Math.floor(seats) || 1));
    const user = await currentUser();
    const who = user?.firstName || user?.username || 'A member';
    const where = from.trim() ? ` from ${from.trim().slice(0, 60)}` : '';
    const label = `${who} has ${n} ${n === 1 ? 'seat' : 'seats'}${where}`;
    const { error } = await sb.from('event_slots').insert({
      event_id: eventId,
      kind: 'ride',
      label,
      capacity: n,
      created_by: userId,
    });
    if (error) return { ok: false, error: 'Could not add your ride. Try again.' };
    revalidatePath(`/dashboard/e/${eventId}`);
    return { ok: true };
  } catch (err) {
    console.error('offerRide failed', err);
    return { ok: false };
  }
}
