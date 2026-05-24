'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase } from '@/lib/supabase';
import { weekAnchorUTC } from '@/lib/dashboard/journey';

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
 * The group this member belongs to. Prefer the session's active org, but fall
 * back to their Clerk org membership, so check-in works even when the session
 * has no active org set (common on a phone). Members belong to one group; if
 * somehow more than one, we use the first.
 */
async function resolveMemberOrgId(userId: string, activeOrgId: string | null): Promise<string | null> {
  if (activeOrgId) return activeOrgId;
  try {
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({ userId });
    return res.data[0]?.organization?.id ?? null;
  } catch (err) {
    console.error('resolveMemberOrgId failed', err);
    return null;
  }
}

/** Mark "I was at group this week." Upserts one row per member per week. */
export async function checkInThisWeek(): Promise<{ ok: boolean; reason?: string }> {
  const { userId, orgId } = await auth();
  if (!userId) return { ok: false, reason: 'not-signed-in' };

  const groupId = await resolveMemberOrgId(userId, orgId ?? null);
  if (!groupId) return { ok: false, reason: 'no-group' };

  const sb = getSupabase();
  const gatheringDate = weekAnchorUTC();

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
  const anchors: string[] = [];
  for (let i = 0; i < weeks; i += 1) {
    anchors.push(weekAnchorUTC(new Date(Date.now() - i * 7 * 86_400_000)));
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

    const byAnchor = new Map(
      ((data as { gathering_date: string; checked_in: boolean; confirmed: boolean }[] | null) ?? []).map(
        (r) => [r.gathering_date.slice(0, 10), r] as const,
      ),
    );

    return anchors.map((weekAnchor) => {
      const row = byAnchor.get(weekAnchor);
      return {
        weekAnchor,
        checkedIn: Boolean(row?.checked_in),
        confirmed: Boolean(row?.confirmed),
      };
    });
  } catch (err) {
    console.error('getMyAttendance failed', err);
    return blank();
  }
}
