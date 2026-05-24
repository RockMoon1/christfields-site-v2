'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getLeaderContext, canViewMember } from '@/lib/faithflow/leader-access';
import { computeGroup, computeMemberDetail } from '@/lib/faithflow/analytics';
import { getSupabase } from '@/lib/supabase';
import { weekAnchorUTC } from '@/lib/dashboard/journey';
import type {
  AttendanceBoardResult,
  AttendanceMemberRow,
  GroupDataResult,
  MemberDetail,
} from '@/lib/faithflow/types';

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Recent week anchors (Sundays, UTC), newest first, for the week switcher. */
function recentWeekAnchors(count = 6): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(weekAnchorUTC(new Date(Date.now() - i * 7 * 86_400_000)));
  }
  return out;
}

/**
 * Server actions for the FaithFlow leader dashboard. Authorization lives in
 * leader-access (the requester must be the admin of the active org, and a
 * target member must belong to it). The actual analytics live in the shared
 * engine in lib/faithflow/analytics.ts, so the leader and master views always
 * agree.
 */

export async function getGroupData(): Promise<GroupDataResult> {
  const ctx = await getLeaderContext();
  if (!ctx) return { state: 'not-leader' };
  if (ctx.members.length === 0) {
    return { state: 'no-members', org: { id: ctx.orgId, name: ctx.orgName } };
  }
  const { summaries, group } = await computeGroup(ctx.members);
  return { state: 'ready', org: { id: ctx.orgId, name: ctx.orgName }, members: summaries, group };
}

export async function getMemberDetail(memberId: string): Promise<MemberDetail | null> {
  if (!(await canViewMember(memberId))) return null;
  const ctx = await getLeaderContext();
  const member = ctx?.members.find((m) => m.userId === memberId);
  if (!member) return null;
  return computeMemberDetail(member);
}

/* ============================================================
   In-person attendance. Members check in; leaders confirm. Only
   leader-confirmed weeks count toward the journey gate.
   ============================================================ */

export async function getAttendanceBoard(weekAnchor?: string): Promise<AttendanceBoardResult> {
  const ctx = await getLeaderContext();
  if (!ctx) return { state: 'not-leader' };
  if (ctx.members.length === 0) {
    return { state: 'no-members', org: { id: ctx.orgId, name: ctx.orgName } };
  }

  const anchor = weekAnchor && WEEK_RE.test(weekAnchor) ? weekAnchor : weekAnchorUTC();
  const sb = getSupabase();

  const { data } = await sb
    .from('group_attendance')
    .select('clerk_user_id, checked_in, confirmed')
    .eq('org_id', ctx.orgId)
    .eq('gathering_date', anchor);

  const byUser = new Map(
    ((data as { clerk_user_id: string; checked_in: boolean; confirmed: boolean }[] | null) ?? []).map(
      (r) => [r.clerk_user_id, r] as const,
    ),
  );

  const rows: AttendanceMemberRow[] = ctx.members.map((m) => {
    const r = byUser.get(m.userId);
    return {
      userId: m.userId,
      name: m.name,
      imageUrl: m.imageUrl,
      isLeader: m.isLeader,
      checkedIn: Boolean(r?.checked_in),
      confirmed: Boolean(r?.confirmed),
    };
  });

  return {
    state: 'ready',
    org: { id: ctx.orgId, name: ctx.orgName },
    weekAnchor: anchor,
    rows,
    recentWeeks: recentWeekAnchors(),
    confirmedCount: rows.filter((r) => r.confirmed).length,
  };
}

/** Confirm (or un-confirm) that a member was present at a given week's gathering. */
export async function setMemberAttendance(
  memberId: string,
  weekAnchor: string,
  present: boolean,
): Promise<{ ok: boolean }> {
  if (!WEEK_RE.test(weekAnchor)) return { ok: false };

  const ctx = await getLeaderContext();
  if (!ctx) return { ok: false };
  if (!ctx.members.some((m) => m.userId === memberId)) return { ok: false };

  const { userId: leaderId } = await auth();
  const sb = getSupabase();

  const { error } = await sb.from('group_attendance').upsert(
    {
      org_id: ctx.orgId,
      clerk_user_id: memberId,
      gathering_date: weekAnchor,
      confirmed: present,
      confirmed_by: present ? leaderId : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,clerk_user_id,gathering_date' },
  );
  if (error) {
    console.error('setMemberAttendance failed', error);
    return { ok: false };
  }

  revalidatePath('/dashboard/leader/attendance');
  // The member's gate may change, so refresh their dashboard shell too.
  revalidatePath('/dashboard', 'layout');
  return { ok: true };
}
