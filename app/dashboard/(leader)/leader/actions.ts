'use server';

import { getLeaderContext, canViewMember } from '@/lib/faithflow/leader-access';
import { computeGroup, computeMemberDetail } from '@/lib/faithflow/analytics';
import type { GroupDataResult, MemberDetail } from '@/lib/faithflow/types';

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
