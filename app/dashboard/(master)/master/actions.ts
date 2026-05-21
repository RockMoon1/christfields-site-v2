'use server';

import { isMaster, getAllGroups, findMember, type LeaderActivity } from '@/lib/faithflow/master-access';
import { computeGroup, computeMemberDetail } from '@/lib/faithflow/analytics';
import type { GroupAnalytics, MemberDetail, MemberSummary } from '@/lib/faithflow/types';

/**
 * Master oversight actions. Every action gates on isMaster() first. The
 * analytics come from the same shared engine the leaders use, so a master sees
 * exactly what a leader sees, across every group, plus leader accountability.
 *
 * Privacy: members' private content (journals, examen, gratitude, mood notes,
 * unshared prayers) is never read here either.
 */

export interface MasterGroupOverview {
  orgId: string;
  orgName: string;
  leaders: LeaderActivity[];
  memberCount: number;
  group: GroupAnalytics;
  members: MemberSummary[];
}

export type MasterOverviewResult =
  | {
      state: 'ready';
      groups: MasterGroupOverview[];
      totals: { groups: number; leaders: number; members: number; activeThisWeek: number; needsAttention: number };
    }
  | { state: 'not-master' }
  | { state: 'no-groups' };

export async function getMasterOverview(): Promise<MasterOverviewResult> {
  if (!(await isMaster())) return { state: 'not-master' };

  const groups = await getAllGroups();
  if (groups.length === 0) return { state: 'no-groups' };

  const overviews: MasterGroupOverview[] = await Promise.all(
    groups.map(async (g) => {
      const { summaries, group } = await computeGroup(g.members);
      return {
        orgId: g.orgId,
        orgName: g.orgName,
        leaders: g.leaders,
        memberCount: g.members.length,
        group,
        members: summaries,
      };
    }),
  );

  const totals = {
    groups: overviews.length,
    leaders: overviews.reduce((a, b) => a + b.leaders.length, 0),
    members: overviews.reduce((a, b) => a + b.memberCount, 0),
    activeThisWeek: overviews.reduce((a, b) => a + b.group.activeThisWeek, 0),
    needsAttention: overviews.reduce((a, b) => a + b.members.filter((m) => m.attention).length, 0),
  };

  return { state: 'ready', groups: overviews, totals };
}

export async function getMemberForMaster(memberId: string): Promise<MemberDetail | null> {
  if (!(await isMaster())) return null;
  const member = await findMember(memberId);
  if (!member) return null;
  return computeMemberDetail(member);
}
