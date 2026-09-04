import { getSupabase } from '@/lib/supabase';
import { SLOTS, upcomingDays, weeklyKey, overrideKey, memberIsFree, type Slot, type MemberAvailability } from '@/lib/dashboard/availability';
import type { GroupMember } from '@/lib/groups/membership';
import { SCOPES } from '@/lib/google/oauth';

/**
 * The scheduler's brain: fold the group's usual-week pattern, date overrides and
 * calendar busy blocks into a 21-day x 3-slot picture, and rank the best times.
 *
 * Privacy, by construction and by rule:
 *  - Only availability_weekly, availability_overrides, calendar_busy, and the
 *    fact of a connected calendar are read. None of them can hold a title.
 *  - Cells carry COUNTS only. Names of who is FREE appear only on the top three
 *    best-time cards, never per cell, so a leader can never read a member's
 *    busy pattern by absence across 63 cells.
 *  - "unknown" means the member has told us nothing at all (no weekly rows, no
 *    overrides, no connected calendar). It is never shown as busy or free.
 *  - A member who connected a calendar (pasted link or Google free/busy) and
 *    never tapped the grid counts as free wherever the calendar is not busy.
 *
 * Authorization is the caller's job (requireLeaderOf). This function trusts the
 * roster it is handed.
 */

export const DAYS_AHEAD = 21;

export interface PlanCellCounts {
  slot: Slot;
  free: number;
  unknown: number;
}

export interface PlanDay {
  iso: string;
  dayShort: string;
  dateLabel: string;
  weekday: number;
  slots: PlanCellCounts[];
}

export interface PlanBest {
  iso: string;
  dayShort: string;
  dateLabel: string;
  weekday: number;
  slot: Slot;
  free: number;
  /** First names of who said they are free. Only ever on best-time cards. */
  freeNames: string[];
}

export interface GroupAvailability {
  total: number;
  /** How many members have told us anything about when they are free. */
  informed: number;
  days: PlanDay[];
  best: PlanBest[];
}

export async function getGroupAvailability(
  members: GroupMember[],
  tz: string,
  nowMs: number = Date.now(),
): Promise<GroupAvailability> {
  const userIds = members.map((m) => m.userId);
  const firstNameByUser = new Map(members.map((m) => [m.userId, m.firstName]));
  const days = upcomingDays(DAYS_AHEAD, nowMs, tz);
  if (userIds.length === 0) return { total: 0, informed: 0, days: [], best: [] };

  const sb = getSupabase();
  const [weeklyRes, overrideRes, busyRes, feedRes, googleRes] = await Promise.all([
    sb.from('availability_weekly').select('clerk_user_id, weekday, slot').in('clerk_user_id', userIds),
    sb
      .from('availability_overrides')
      .select('clerk_user_id, on_date, slot, available')
      .in('clerk_user_id', userIds)
      .gte('on_date', days[0].iso)
      .lte('on_date', days[days.length - 1].iso),
    sb
      .from('calendar_busy')
      .select('clerk_user_id, on_date, slot')
      .in('clerk_user_id', userIds)
      .gte('on_date', days[0].iso)
      .lte('on_date', days[days.length - 1].iso),
    sb.from('calendar_feeds').select('clerk_user_id').in('clerk_user_id', userIds),
    sb.from('google_connections').select('clerk_user_id, scopes').eq('status', 'ok').in('clerk_user_id', userIds),
  ]);

  if (weeklyRes.error) console.error('getGroupAvailability: weekly load failed', weeklyRes.error);
  if (overrideRes.error) console.error('getGroupAvailability: override load failed', overrideRes.error);
  if (busyRes.error) console.error('getGroupAvailability: busy load failed', busyRes.error);

  const informedUsers = new Set<string>();
  const calendarUsers = new Set<string>();

  const weeklyByUser = new Map<string, Set<string>>();
  for (const r of (weeklyRes.data as { clerk_user_id: string; weekday: number; slot: string }[] | null) ?? []) {
    const set = weeklyByUser.get(r.clerk_user_id) ?? new Set<string>();
    set.add(weeklyKey(r.weekday, r.slot as Slot));
    weeklyByUser.set(r.clerk_user_id, set);
    informedUsers.add(r.clerk_user_id);
  }

  const overByUser = new Map<string, Map<string, boolean>>();
  for (const r of (overrideRes.data as
    | { clerk_user_id: string; on_date: string; slot: string; available: boolean }[]
    | null) ?? []) {
    const m = overByUser.get(r.clerk_user_id) ?? new Map<string, boolean>();
    m.set(overrideKey(r.on_date, r.slot as Slot), r.available);
    overByUser.set(r.clerk_user_id, m);
    informedUsers.add(r.clerk_user_id);
  }

  const busyByUser = new Map<string, Set<string>>();
  for (const r of (busyRes.data as { clerk_user_id: string; on_date: string; slot: string }[] | null) ?? []) {
    const set = busyByUser.get(r.clerk_user_id) ?? new Set<string>();
    set.add(overrideKey(r.on_date, r.slot as Slot));
    busyByUser.set(r.clerk_user_id, set);
    informedUsers.add(r.clerk_user_id);
    calendarUsers.add(r.clerk_user_id);
  }
  for (const r of (feedRes.data as { clerk_user_id: string }[] | null) ?? []) {
    informedUsers.add(r.clerk_user_id);
    calendarUsers.add(r.clerk_user_id);
  }
  for (const r of (googleRes.data as { clerk_user_id: string; scopes: string[] }[] | null) ?? []) {
    if (!r.scopes?.includes(SCOPES.busy)) continue;
    informedUsers.add(r.clerk_user_id);
    calendarUsers.add(r.clerk_user_id);
  }

  const EMPTY_SET = new Set<string>();
  const EMPTY_MAP = new Map<string, boolean>();
  const unknownCount = userIds.filter((u) => !informedUsers.has(u)).length;

  const availabilityOf = (uid: string): MemberAvailability => ({
    weekly: weeklyByUser.get(uid) ?? EMPTY_SET,
    overrides: overByUser.get(uid) ?? EMPTY_MAP,
    busy: busyByUser.get(uid) ?? EMPTY_SET,
    hasCalendarSource: calendarUsers.has(uid),
  });

  const planDays: PlanDay[] = [];
  const candidates: PlanBest[] = [];

  for (const d of days) {
    const slots: PlanCellCounts[] = [];
    for (const slot of SLOTS) {
      const freeNames: string[] = [];
      for (const uid of userIds) {
        if (!informedUsers.has(uid)) continue;
        if (memberIsFree(d.iso, d.weekday, slot, availabilityOf(uid))) {
          freeNames.push(firstNameByUser.get(uid) ?? 'Member');
        }
      }
      slots.push({ slot, free: freeNames.length, unknown: unknownCount });
      if (freeNames.length > 0) {
        candidates.push({
          iso: d.iso,
          dayShort: d.dayShort,
          dateLabel: d.dateLabel,
          weekday: d.weekday,
          slot,
          free: freeNames.length,
          freeNames,
        });
      }
    }
    planDays.push({ iso: d.iso, dayShort: d.dayShort, dateLabel: d.dateLabel, weekday: d.weekday, slots });
  }

  const best = candidates
    .sort((a, b) => b.free - a.free || a.iso.localeCompare(b.iso))
    .slice(0, 3);

  return { total: userIds.length, informed: informedUsers.size, days: planDays, best };
}
