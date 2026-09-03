'use server';

import { randomUUID } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  getSupabase,
  type EventRow,
  type EventRsvpRow,
  type EventAttendanceRow,
  type EventSlotRow,
  type EventSlotClaimRow,
} from '@/lib/supabase';
import { ledOrgs, requireLeaderOf, getGroupMembers, type GroupMember } from '@/lib/groups/membership';
import { isEventType, type EventType } from '@/lib/dashboard/events';
import { weeklyOccurrences, MAX_SERIES_WEEKS } from '@/lib/schedule/series';
import { getGroupAvailability, type GroupAvailability } from '@/lib/schedule/group-availability';
import { recordChange } from '@/lib/notify/activity';
import { whenInWords } from '@/lib/dashboard/format';
import { toMemberEvent, type MemberEvent } from '@/lib/schedule/public-event';
import { appUrl } from '@/lib/dashboard/prefs';

/**
 * Leader actions. Every one resolves the event's org and passes requireLeaderOf,
 * which checks the signed-in user's OWN memberships (never the session's active
 * org, which is usually null on a phone). Cancel is soft: RSVPs survive so the
 * cancellation has recipients. Every change writes an event_changes row first;
 * push and email attach to those rows in Phase 2.
 */

const TITLE_MAX = 120;
const DESC_MAX = 600;
const LOCATION_MAX = 160;
const NOTE_MAX = 400;
const GROUP_TZ = 'America/Denver';

interface EventLeaderCtx {
  event: EventRow;
  orgName: string;
  members: GroupMember[];
  userId: string;
}

async function leaderOfEvent(eventId: string): Promise<EventLeaderCtx | null> {
  const { userId } = await auth();
  if (!userId || !eventId) return null;
  const sb = getSupabase();
  const { data } = await sb.from('events').select('*').eq('id', eventId).maybeSingle();
  if (!data) return null;
  const event = data as EventRow;
  const ctx = await requireLeaderOf(event.org_id);
  if (!ctx) return null;
  return { event, orgName: ctx.orgName, members: ctx.members, userId };
}

function isRealTz(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   Post.
   ============================================================ */

export interface PostInput {
  orgId: string;
  title: string;
  type: string;
  startsAt: string; // ISO from the client (datetime-local converted to UTC)
  endsAt?: string | null;
  tz: string; // the posting leader's IANA zone
  location: string;
  description: string;
  memberNote: string;
  leaderNote: string;
  weeks: number; // 1 = once; up to MAX_SERIES_WEEKS
  bringItems: string[];
  ridesEnabled: boolean;
  notify: boolean;
}

export async function createEvent(input: PostInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: 'Not signed in.' };
    const ctx = await requireLeaderOf(input.orgId);
    if (!ctx) return { ok: false, error: 'You are not a leader of that group.' };

    const title = (input.title || '').trim();
    if (!title) return { ok: false, error: 'Give it a name.' };
    const start = new Date(input.startsAt);
    if (Number.isNaN(start.getTime())) return { ok: false, error: 'Pick a day and time.' };
    let endsAt: string | null = null;
    if (input.endsAt) {
      const end = new Date(input.endsAt);
      if (!Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) endsAt = end.toISOString();
    }
    const type: EventType = isEventType(input.type) ? input.type : 'gathering';
    const tz = isRealTz(input.tz) ? input.tz : GROUP_TZ;
    const weeks = Math.max(1, Math.min(MAX_SERIES_WEEKS, Math.floor(input.weeks) || 1));
    const occurrences = weeklyOccurrences(start.toISOString(), endsAt, tz, weeks);
    const seriesId = weeks > 1 ? randomUUID() : null;

    const base = {
      org_id: ctx.orgId,
      created_by: userId,
      title: title.slice(0, TITLE_MAX),
      description: (input.description || '').trim().slice(0, DESC_MAX),
      event_type: type,
      location: (input.location || '').trim().slice(0, LOCATION_MAX),
      tz,
      series_id: seriesId,
      member_note: (input.memberNote || '').trim().slice(0, NOTE_MAX),
      leader_note: (input.leaderNote || '').trim().slice(0, NOTE_MAX),
      rides_enabled: !!input.ridesEnabled,
      status: 'scheduled',
    };

    const sb = getSupabase();
    const { data, error } = await sb
      .from('events')
      .insert(occurrences.map((o) => ({ ...base, starts_at: o.startsAt, ends_at: o.endsAt })))
      .select('id, starts_at')
      .order('starts_at', { ascending: true });
    if (error || !data || data.length === 0) {
      console.error('createEvent failed', error);
      return { ok: false, error: 'Could not save it. Please try again.' };
    }
    const rows = data as { id: string; starts_at: string }[];
    const firstId = rows[0].id;

    const items = (input.bringItems || []).map((s) => s.trim()).filter(Boolean).slice(0, 12);
    if (items.length > 0) {
      await sb.from('event_slots').insert(
        rows.flatMap((r) =>
          items.map((label) => ({
            event_id: r.id,
            kind: 'bring',
            label: label.slice(0, 80),
            capacity: 1,
            created_by: userId,
          })),
        ),
      );
    }

    if (input.notify) {
      const when = whenInWords(rows[0].starts_at, tz);
      const summary = weeks > 1 ? `${title}, weekly from ${when}` : `${title}, ${when}`;
      await recordChange(sb, { orgId: ctx.orgId, eventId: firstId, kind: 'created', summary, createdBy: userId });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/lead');
    return { ok: true, id: firstId };
  } catch (err) {
    console.error('createEvent failed', err);
    return { ok: false, error: 'Something went wrong.' };
  }
}

/* ============================================================
   Change or cancel.
   ============================================================ */

export interface EditInput {
  title: string;
  type: string;
  startsAt: string;
  endsAt?: string | null;
  location: string;
  description: string;
  memberNote: string;
  leaderNote: string;
  ridesEnabled: boolean;
  /** Fan out a changed notice. The form defaults it on only when time or place changed. */
  notify: boolean;
  scope: 'one' | 'following';
}

export async function updateEvent(eventId: string, input: EditInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return { ok: false, error: 'Not allowed.' };
    const { event, userId } = ctx;
    if (event.status !== 'scheduled') return { ok: false, error: 'This one was called off.' };

    const title = (input.title || '').trim();
    if (!title) return { ok: false, error: 'Give it a name.' };
    const start = new Date(input.startsAt);
    if (Number.isNaN(start.getTime())) return { ok: false, error: 'Pick a day and time.' };
    let endsAt: string | null = null;
    if (input.endsAt) {
      const end = new Date(input.endsAt);
      if (!Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) endsAt = end.toISOString();
    }
    const type: EventType = isEventType(input.type) ? input.type : 'gathering';
    const location = (input.location || '').trim().slice(0, LOCATION_MAX);
    const timeMoved = new Date(event.starts_at).getTime() !== start.getTime();
    const placeMoved = (event.location || '') !== location;

    const patch = {
      title: title.slice(0, TITLE_MAX),
      event_type: type,
      location,
      description: (input.description || '').trim().slice(0, DESC_MAX),
      member_note: (input.memberNote || '').trim().slice(0, NOTE_MAX),
      leader_note: (input.leaderNote || '').trim().slice(0, NOTE_MAX),
      rides_enabled: !!input.ridesEnabled,
      updated_at: new Date().toISOString(),
    };

    const sb = getSupabase();
    const { error } = await sb
      .from('events')
      .update({ ...patch, starts_at: start.toISOString(), ends_at: endsAt, version: (event.version ?? 0) + 1 })
      .eq('id', eventId)
      .eq('org_id', event.org_id);
    if (error) return { ok: false, error: 'Could not save the change.' };

    if (input.scope === 'following' && event.series_id) {
      const deltaMs = start.getTime() - new Date(event.starts_at).getTime();
      const durationMs = endsAt ? new Date(endsAt).getTime() - start.getTime() : null;
      const { data: rest } = await sb
        .from('events')
        .select('id, starts_at, version')
        .eq('series_id', event.series_id)
        .eq('org_id', event.org_id)
        .eq('status', 'scheduled')
        .gt('starts_at', event.starts_at);
      for (const r of (rest as { id: string; starts_at: string; version: number }[] | null) ?? []) {
        const s = new Date(new Date(r.starts_at).getTime() + deltaMs).toISOString();
        const e = durationMs === null ? null : new Date(new Date(s).getTime() + durationMs).toISOString();
        await sb
          .from('events')
          .update({ ...patch, starts_at: s, ends_at: e, version: (r.version ?? 0) + 1 })
          .eq('id', r.id);
      }
    }

    if (input.notify && (timeMoved || placeMoved)) {
      const parts: string[] = [];
      if (timeMoved) parts.push(`Moved to ${whenInWords(start.toISOString(), event.tz)}`);
      if (placeMoved) parts.push(location ? `Now at ${location}` : 'Place changed');
      await recordChange(sb, {
        orgId: event.org_id,
        eventId,
        kind: 'changed',
        summary: `${title}: ${parts.join('. ')}`,
        createdBy: userId,
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/lead');
    revalidatePath(`/dashboard/e/${eventId}`);
    return { ok: true };
  } catch (err) {
    console.error('updateEvent failed', err);
    return { ok: false, error: 'Something went wrong.' };
  }
}

export async function cancelEvent(eventId: string, reason: string): Promise<{ ok: boolean }> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return { ok: false };
    const { event, userId } = ctx;
    const sb = getSupabase();
    const now = new Date().toISOString();
    const cleanReason = (reason || '').trim().slice(0, 200);
    const { error } = await sb
      .from('events')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        cancel_reason: cleanReason,
        updated_at: now,
        version: (event.version ?? 0) + 1,
      })
      .eq('id', eventId)
      .eq('org_id', event.org_id);
    if (error) return { ok: false };
    await recordChange(sb, {
      orgId: event.org_id,
      eventId,
      kind: 'cancelled',
      summary: `${event.title} is called off${cleanReason ? `: ${cleanReason.slice(0, 120)}` : ''}`,
      createdBy: userId,
    });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/lead');
    revalidatePath(`/dashboard/e/${eventId}`);
    return { ok: true };
  } catch (err) {
    console.error('cancelEvent failed', err);
    return { ok: false };
  }
}

/* ============================================================
   The leader view of one event.
   ============================================================ */

export interface RosterName {
  userId: string;
  name: string;
  imageUrl: string;
  firstTime: boolean;
  present: boolean | null;
}

export interface SlotGap {
  id: string;
  kind: 'bring' | 'ride';
  label: string;
  capacity: number;
  taken: number;
  claimants: string[];
}

export interface LeaderEventView {
  event: MemberEvent;
  leaderNote: string;
  thanksNote: string;
  going: RosterName[];
  maybe: RosterName[];
  cant: RosterName[];
  silent: RosterName[];
  slots: SlotGap[];
  attendanceOpen: boolean;
  markedCount: number;
  skippedEmails: number;
  shareText: string;
}

export async function getLeaderEvent(eventId: string): Promise<LeaderEventView | null> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return null;
    const { event, orgName, members } = ctx;
    const sb = getSupabase();
    const [rsvpRes, attRes, slotRes, skippedRes] = await Promise.all([
      sb.from('event_rsvps').select('*').eq('event_id', eventId),
      sb.from('event_attendance').select('*').eq('event_id', eventId),
      sb.from('event_slots').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
      sb
        .from('notification_deliveries')
        .select('id', { count: 'exact', head: true })
        .like('dedupe_key', `${eventId}:%`)
        .eq('status', 'skipped_budget'),
    ]);
    const rsvps = (rsvpRes.data as EventRsvpRow[] | null) ?? [];
    const attendance = new Map<string, boolean>(
      ((attRes.data as EventAttendanceRow[] | null) ?? []).map((a) => [a.clerk_user_id, a.present]),
    );
    const byUser = new Map(rsvps.map((r) => [r.clerk_user_id, r]));

    const toName = (m: GroupMember): RosterName => {
      const r = byUser.get(m.userId);
      return {
        userId: m.userId,
        name: m.firstName,
        imageUrl: m.imageUrl,
        firstTime: !!r?.first_time,
        present: attendance.has(m.userId) ? (attendance.get(m.userId) as boolean) : null,
      };
    };
    const going = members.filter((m) => byUser.get(m.userId)?.status === 'going').map(toName);
    const maybe = members.filter((m) => byUser.get(m.userId)?.status === 'maybe').map(toName);
    const cant = members.filter((m) => byUser.get(m.userId)?.status === 'not_going').map(toName);
    const silent = members.filter((m) => !byUser.has(m.userId)).map(toName);

    const slotRows = (slotRes.data as EventSlotRow[] | null) ?? [];
    let claims: EventSlotClaimRow[] = [];
    if (slotRows.length > 0) {
      const { data } = await sb.from('event_slot_claims').select('*').in('slot_id', slotRows.map((s) => s.id));
      claims = (data as EventSlotClaimRow[] | null) ?? [];
    }
    const slots: SlotGap[] = slotRows.map((s) => {
      const mine = claims.filter((c) => c.slot_id === s.id);
      return {
        id: s.id,
        kind: s.kind,
        label: s.label,
        capacity: s.capacity,
        taken: mine.reduce((n, c) => n + c.qty, 0),
        claimants: mine.map((c) => c.display_name),
      };
    });

    const startMs = new Date(event.starts_at).getTime();
    const now = Date.now();
    const attendanceOpen =
      event.status === 'scheduled' && now >= startMs - 60 * 60 * 1000 && now <= startMs + 3 * 86_400_000;

    const where = event.location ? ` at ${event.location}` : '';
    const shareText = `${event.title}, ${whenInWords(event.starts_at, event.tz)}${where}. ${going.length} in so far. Say if you are coming: ${appUrl()}/dashboard/e/${event.id}`;

    return {
      event: toMemberEvent(event, orgName),
      leaderNote: event.leader_note || '',
      thanksNote: event.thanks_note || '',
      going,
      maybe,
      cant,
      silent,
      slots,
      attendanceOpen,
      markedCount: attendance.size,
      skippedEmails: skippedRes.count ?? 0,
      shareText,
    };
  } catch (err) {
    console.error('getLeaderEvent failed', err);
    return null;
  }
}

/* ============================================================
   Who came.
   ============================================================ */

export async function markAttendance(eventId: string, memberId: string, present: boolean): Promise<{ ok: boolean }> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return { ok: false };
    if (!ctx.members.some((m) => m.userId === memberId)) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb.from('event_attendance').upsert(
      { event_id: eventId, clerk_user_id: memberId, present, marked_by: ctx.userId, marked_at: new Date().toISOString() },
      { onConflict: 'event_id,clerk_user_id' },
    );
    if (error) return { ok: false };
    if (present) {
      await sb
        .from('org_member_seen')
        .upsert({ org_id: ctx.event.org_id, clerk_user_id: memberId }, { onConflict: 'org_id,clerk_user_id', ignoreDuplicates: true });
    }
    revalidatePath(`/dashboard/e/${eventId}`);
    revalidatePath('/dashboard/lead');
    return { ok: true };
  } catch (err) {
    console.error('markAttendance failed', err);
    return { ok: false };
  }
}

/** Everyone who said yes came. */
export async function markEveryoneCame(eventId: string): Promise<{ ok: boolean }> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return { ok: false };
    const sb = getSupabase();
    const { data } = await sb.from('event_rsvps').select('clerk_user_id').eq('event_id', eventId).eq('status', 'going');
    const ids = ((data as { clerk_user_id: string }[] | null) ?? []).map((r) => r.clerk_user_id);
    if (ids.length === 0) return { ok: true };
    const now = new Date().toISOString();
    await sb.from('event_attendance').upsert(
      ids.map((id) => ({ event_id: eventId, clerk_user_id: id, present: true, marked_by: ctx.userId, marked_at: now })),
      { onConflict: 'event_id,clerk_user_id' },
    );
    await sb
      .from('org_member_seen')
      .upsert(
        ids.map((id) => ({ org_id: ctx.event.org_id, clerk_user_id: id })),
        { onConflict: 'org_id,clerk_user_id', ignoreDuplicates: true },
      );
    revalidatePath(`/dashboard/e/${eventId}`);
    revalidatePath('/dashboard/lead');
    return { ok: true };
  } catch (err) {
    console.error('markEveryoneCame failed', err);
    return { ok: false };
  }
}

/** Run once per group before first-timer lines mean anything. */
export async function markEveryoneKnown(orgId: string): Promise<{ ok: boolean; count: number }> {
  try {
    const ctx = await requireLeaderOf(orgId);
    if (!ctx) return { ok: false, count: 0 };
    const sb = getSupabase();
    const rows = ctx.members.map((m) => ({ org_id: orgId, clerk_user_id: m.userId }));
    if (rows.length === 0) return { ok: true, count: 0 };
    const { error } = await sb
      .from('org_member_seen')
      .upsert(rows, { onConflict: 'org_id,clerk_user_id', ignoreDuplicates: true });
    revalidatePath('/dashboard/lead/group');
    return { ok: !error, count: rows.length };
  } catch {
    return { ok: false, count: 0 };
  }
}

/* ============================================================
   Slots and thanks.
   ============================================================ */

export async function addSlot(
  eventId: string,
  kind: 'bring' | 'ride',
  label: string,
  capacity: number,
): Promise<{ ok: boolean }> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return { ok: false };
    const text = (label || '').trim().slice(0, 80);
    if (!text || (kind !== 'bring' && kind !== 'ride')) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb.from('event_slots').insert({
      event_id: eventId,
      kind,
      label: text,
      capacity: Math.max(1, Math.min(20, Math.floor(capacity) || 1)),
      created_by: ctx.userId,
    });
    revalidatePath(`/dashboard/e/${eventId}`);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function removeSlot(eventId: string, slotId: string): Promise<{ ok: boolean }> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb.from('event_slots').delete().eq('id', slotId).eq('event_id', eventId);
    revalidatePath(`/dashboard/e/${eventId}`);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function postThanks(eventId: string, note: string): Promise<{ ok: boolean }> {
  try {
    const ctx = await leaderOfEvent(eventId);
    if (!ctx) return { ok: false };
    const text = (note || '').trim().slice(0, 240);
    if (!text) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb
      .from('events')
      .update({ thanks_note: text, updated_at: new Date().toISOString() })
      .eq('id', eventId);
    if (error) return { ok: false };
    await recordChange(sb, { orgId: ctx.event.org_id, eventId, kind: 'thanks', summary: text, createdBy: ctx.userId });
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/e/${eventId}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* ============================================================
   Lead: This week.
   ============================================================ */

export interface LeadEventRow {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  tz: string;
  status: 'scheduled' | 'cancelled';
  going: number;
  maybe: number;
  cant: number;
  silent: number;
  firstTimers: number;
  marked: boolean;
}

export type LeadPrompt =
  | {
      kind: 'post';
      iso: string;
      slot: string;
      dayShort: string;
      dateLabel: string;
      free: number;
      total: number;
      names: string[];
    }
  | { kind: 'prep'; eventId: string; title: string; startsAt: string; tz: string }
  | { kind: 'whoCame'; eventId: string; title: string }
  | { kind: 'none' };

export interface LeadGroup {
  orgId: string;
  orgName: string;
  total: number;
  informed: number;
  events: LeadEventRow[];
  prompt: LeadPrompt;
  sayHi: string[];
  sayHiReady: boolean;
  seriesEnding: { title: string; lastAt: string; tz: string; eventId: string } | null;
}

export interface LeadOverview {
  groups: LeadGroup[];
  tz: string;
}

interface MarkedRow {
  event_id: string;
  clerk_user_id: string;
  present: boolean;
}

/** People who used to come and missed the last two marked gatherings. Max 3, leader-only. */
async function sayHiFor(orgId: string, members: GroupMember[]): Promise<{ ready: boolean; names: string[] }> {
  const sb = getSupabase();
  const { data: markedEvents } = await sb
    .from('events')
    .select('id, starts_at')
    .eq('org_id', orgId)
    .lte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: false })
    .limit(40);
  const candidates = (markedEvents as { id: string; starts_at: string }[] | null) ?? [];
  if (candidates.length === 0) return { ready: false, names: [] };
  const { data: att } = await sb
    .from('event_attendance')
    .select('event_id, clerk_user_id, present')
    .in('event_id', candidates.map((e) => e.id));
  const rows = (att as MarkedRow[] | null) ?? [];
  const markedIds = new Set(rows.map((r) => r.event_id));
  const ordered = candidates.filter((e) => markedIds.has(e.id)).map((e) => e.id);
  if (ordered.length < 6) return { ready: false, names: [] };
  const lastSix = ordered.slice(0, 6);
  const lastTwo = lastSix.slice(0, 2);
  const presentIn = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.present || !lastSix.includes(r.event_id)) continue;
    const set = presentIn.get(r.clerk_user_id) ?? new Set<string>();
    set.add(r.event_id);
    presentIn.set(r.clerk_user_id, set);
  }
  const names: string[] = [];
  for (const m of members) {
    if (m.isLeader) continue;
    const set = presentIn.get(m.userId);
    if (!set || set.size === 0) continue;
    if (lastTwo.every((id) => !set.has(id))) names.push(m.firstName);
    if (names.length >= 3) break;
  }
  return { ready: true, names };
}

export async function getLeadOverview(): Promise<LeadOverview> {
  const empty: LeadOverview = { groups: [], tz: GROUP_TZ };
  try {
    const { userId } = await auth();
    if (!userId) return empty;
    const orgs = await ledOrgs();
    if (orgs.length === 0) return empty;
    const sb = getSupabase();
    const now = Date.now();
    const since = new Date(now - 3 * 86_400_000).toISOString();
    const until = new Date(now + 14 * 86_400_000).toISOString();

    const groups: LeadGroup[] = [];
    for (const org of orgs) {
      const members = await getGroupMembers(org.orgId);
      const [eventsRes, availability, sayHi, seriesRes] = await Promise.all([
        sb
          .from('events')
          .select('*')
          .eq('org_id', org.orgId)
          .gte('starts_at', since)
          .lte('starts_at', until)
          .order('starts_at', { ascending: true }),
        getGroupAvailability(members, GROUP_TZ, now),
        sayHiFor(org.orgId, members),
        sb
          .from('events')
          .select('id, title, starts_at, tz, series_id')
          .eq('org_id', org.orgId)
          .eq('status', 'scheduled')
          .not('series_id', 'is', null)
          .gte('starts_at', new Date(now).toISOString())
          .order('starts_at', { ascending: false }),
      ]);
      const rows = (eventsRes.data as EventRow[] | null) ?? [];
      const ids = rows.map((e) => e.id);
      let rsvps: EventRsvpRow[] = [];
      let attendance: EventAttendanceRow[] = [];
      if (ids.length > 0) {
        const [r, a] = await Promise.all([
          sb.from('event_rsvps').select('*').in('event_id', ids),
          sb.from('event_attendance').select('*').in('event_id', ids),
        ]);
        rsvps = (r.data as EventRsvpRow[] | null) ?? [];
        attendance = (a.data as EventAttendanceRow[] | null) ?? [];
      }
      const memberIds = new Set(members.map((m) => m.userId));
      const events: LeadEventRow[] = rows.map((e) => {
        const mine = rsvps.filter((x) => x.event_id === e.id && memberIds.has(x.clerk_user_id));
        const answered = new Set(mine.map((x) => x.clerk_user_id));
        return {
          id: e.id,
          title: e.title,
          type: e.event_type,
          startsAt: e.starts_at,
          tz: e.tz,
          status: e.status === 'cancelled' ? 'cancelled' : 'scheduled',
          going: mine.filter((x) => x.status === 'going').length,
          maybe: mine.filter((x) => x.status === 'maybe').length,
          cant: mine.filter((x) => x.status === 'not_going').length,
          silent: members.filter((m) => !answered.has(m.userId)).length,
          firstTimers: mine.filter((x) => x.first_time && x.status !== 'not_going').length,
          marked: attendance.some((a) => a.event_id === e.id),
        };
      });

      const upcoming = events.filter((e) => e.status === 'scheduled' && new Date(e.startsAt).getTime() > now);
      const recent = events.filter((e) => e.status === 'scheduled' && new Date(e.startsAt).getTime() <= now && !e.marked);
      let prompt: LeadPrompt = { kind: 'none' };
      if (recent.length > 0) {
        const last = recent[recent.length - 1];
        prompt = { kind: 'whoCame', eventId: last.id, title: last.title };
      } else if (upcoming.length > 0 && new Date(upcoming[0].startsAt).getTime() - now < 24 * 60 * 60 * 1000) {
        prompt = { kind: 'prep', eventId: upcoming[0].id, title: upcoming[0].title, startsAt: upcoming[0].startsAt, tz: upcoming[0].tz };
      } else if (upcoming.length === 0 && availability.best.length > 0) {
        const b = availability.best[0];
        prompt = {
          kind: 'post',
          iso: b.iso,
          slot: b.slot,
          dayShort: b.dayShort,
          dateLabel: b.dateLabel,
          free: b.free,
          total: availability.total,
          names: b.freeNames,
        };
      }

      let seriesEnding: LeadGroup['seriesEnding'] = null;
      const lastBySeries = new Map<string, { id: string; title: string; starts_at: string; tz: string }>();
      for (const r of (seriesRes.data as { id: string; title: string; starts_at: string; tz: string; series_id: string }[] | null) ?? []) {
        if (!lastBySeries.has(r.series_id)) lastBySeries.set(r.series_id, r);
      }
      for (const last of lastBySeries.values()) {
        if (new Date(last.starts_at).getTime() - now < 14 * 86_400_000) {
          seriesEnding = { title: last.title, lastAt: last.starts_at, tz: last.tz, eventId: last.id };
          break;
        }
      }

      groups.push({
        orgId: org.orgId,
        orgName: org.orgName,
        total: availability.total,
        informed: availability.informed,
        events,
        prompt,
        sayHi: sayHi.names,
        sayHiReady: sayHi.ready,
        seriesEnding,
      });
    }
    return { groups, tz: GROUP_TZ };
  } catch (err) {
    console.error('getLeadOverview failed', err);
    return empty;
  }
}

/* ============================================================
   Group page: roster + when to gather.
   ============================================================ */

export interface GroupPage {
  orgId: string;
  orgName: string;
  availability: GroupAvailability;
  inviteText: string;
  knownCount: number;
}

export async function getGroupPage(orgId: string): Promise<GroupPage | null> {
  try {
    const ctx = await requireLeaderOf(orgId);
    if (!ctx) return null;
    const sb = getSupabase();
    const [availability, seen] = await Promise.all([
      getGroupAvailability(ctx.members, GROUP_TZ),
      sb.from('org_member_seen').select('clerk_user_id', { count: 'exact', head: true }).eq('org_id', orgId),
    ]);
    return {
      orgId,
      orgName: ctx.orgName,
      availability,
      inviteText: `I added you to ${ctx.orgName} on Christ Fields. It is where we keep our plans. Tap here to see what is coming up: ${appUrl()}/dashboard`,
      knownCount: seen.count ?? 0,
    };
  } catch (err) {
    console.error('getGroupPage failed', err);
    return null;
  }
}

/** Prefill data for the edit form. Leader-only. */
export async function getEventForEdit(eventId: string): Promise<{ event: EventRow; orgName: string } | null> {
  const ctx = await leaderOfEvent(eventId);
  if (!ctx) return null;
  return { event: ctx.event, orgName: ctx.orgName };
}
