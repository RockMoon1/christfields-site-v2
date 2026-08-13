'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase } from '@/lib/supabase';
import { weekAnchorFromDayKey } from '@/lib/dashboard/journey';
import { getMemberToday } from '@/lib/dashboard/timezone-server';

/**
 * Member side of in-person attendance: a simple weekly "I was there." A leader
 * confirms it later (leader actions live in the leader dashboard). Only
 * leader-confirmed weeks count toward the journey gate, so a self check-in is
 * an honest flag, never a way to unlock the deeper stages on its own.
 */

export interface MyAttendanceWeek {
  weekAnchor: string; // YYYY-MM-DD (Sunday, UTC)
  checkedIn: boolean;
  confirmed: boolean;
}

/**
 * The org this member's check-in belongs to. Under the Iron & Ember structure
 * (2026-08) a member can belong to BOTH the main community org and a small
 * group, and the weekly "I was there" is about the small group, so the main
 * community (MAIN_COMMUNITY_ORG_ID) is excluded when picking. Until that env
 * var is set, behavior is unchanged: the session's active org first, else the
 * first Clerk membership.
 */
async function resolveMemberOrgId(userId: string, activeOrgId: string | null): Promise<string | null> {
  const mainOrgId = process.env.MAIN_COMMUNITY_ORG_ID || null;
  if (!mainOrgId && activeOrgId) return activeOrgId;
  if (mainOrgId && activeOrgId && activeOrgId !== mainOrgId) return activeOrgId;
  try {
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({ userId });
    const orgIds = res.data
      .map((m) => m.organization?.id)
      .filter((id): id is string => Boolean(id));
    const smallGroup = mainOrgId ? orgIds.find((id) => id !== mainOrgId) : orgIds[0];
    // A member who is only in the main community (no small group yet) checks
    // in against it until a leader takes them into a group.
    return smallGroup ?? orgIds[0] ?? activeOrgId ?? null;
  } catch (err) {
    console.error('resolveMemberOrgId failed', err);
    return activeOrgId ?? null;
  }
}

/** Mark "I was at group this week." Upserts one row per member per week. */
export async function checkInThisWeek(): Promise<{ ok: boolean; reason?: string }> {
  const { userId, orgId } = await auth();
  if (!userId) return { ok: false, reason: 'not-signed-in' };

  const groupId = await resolveMemberOrgId(userId, orgId ?? null);
  if (!groupId) return { ok: false, reason: 'no-group' };

  const sb = getSupabase();
  const gatheringDate = weekAnchorFromDayKey(await getMemberToday());

  const { error } = await sb.from('group_attendance').upsert(
    {
      org_id: groupId,
      clerk_user_id: userId,
      gathering_date: gatheringDate,
      checked_in: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,clerk_user_id,gathering_date' },
  );
  if (error) {
    console.error('checkInThisWeek failed', error);
    return { ok: false, reason: 'error' };
  }

  revalidatePath('/dashboard', 'layout');
  return { ok: true };
}

/** The member's own recent weeks (for showing their check-in / confirmed state). */
export async function getMyAttendance(weeks = 6): Promise<MyAttendanceWeek[]> {
  // Build the week scaffold up front so we can always return something usable,
  // even if auth or the database is momentarily unavailable. This function runs
  // on the dashboard home, so it must degrade gracefully rather than throw and
  // take the whole page down.
  // Anchored on the member's own week, so a Saturday evening gathering does
  // not land in a different week from the leader's confirmation of it.
  const thisWeek = weekAnchorFromDayKey(await getMemberToday());
  const weekStartMs = new Date(`${thisWeek}T00:00:00Z`).getTime();
  const anchors: string[] = [];
  for (let i = 0; i < weeks; i += 1) {
    anchors.push(new Date(weekStartMs - i * 7 * 86_400_000).toISOString().slice(0, 10));
  }
  const blank = (): MyAttendanceWeek[] =>
    anchors.map((weekAnchor) => ({ weekAnchor, checkedIn: false, confirmed: false }));

  try {
    const { userId } = await auth();
    if (!userId) return blank();

    const sb = getSupabase();
    const earliest = anchors[anchors.length - 1];
    const { data, error } = await sb
      .from('group_attendance')
      .select('gathering_date, checked_in, confirmed')
      .eq('clerk_user_id', userId)
      .gte('gathering_date', earliest);
    if (error) {
      console.error('getMyAttendance failed', error);
      return blank();
    }

    // A member can have a row per org for the same week (under Iron & Ember
    // they belong to the main community AND a small group), so merge rather
    // than letting whichever row arrived last win: present anywhere that week
    // means present, confirmed anywhere means confirmed.
    const byAnchor = new Map<string, { checkedIn: boolean; confirmed: boolean }>();
    for (const r of (data as
      | { gathering_date: string; checked_in: boolean; confirmed: boolean }[]
      | null) ?? []) {
      const key = r.gathering_date.slice(0, 10);
      const prev = byAnchor.get(key);
      byAnchor.set(key, {
        checkedIn: Boolean(prev?.checkedIn) || Boolean(r.checked_in),
        confirmed: Boolean(prev?.confirmed) || Boolean(r.confirmed),
      });
    }

    return anchors.map((weekAnchor) => {
      const row = byAnchor.get(weekAnchor);
      return {
        weekAnchor,
        checkedIn: Boolean(row?.checkedIn),
        confirmed: Boolean(row?.confirmed),
      };
    });
  } catch (err) {
    console.error('getMyAttendance failed', err);
    return blank();
  }
}
