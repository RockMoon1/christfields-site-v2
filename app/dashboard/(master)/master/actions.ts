'use server';

import { isMaster, getAllGroups, findMember, type LeaderActivity } from '@/lib/faithflow/master-access';
import { computeGroup, computeMemberDetail } from '@/lib/faithflow/analytics';
import { guidanceForMaster } from '@/lib/faithflow/guidance';
import type { GroupAnalytics, GuidanceCard, MemberDetail, MemberSummary } from '@/lib/faithflow/types';

/**
 * Master oversight actions. Every action gates on isMaster() first. Analytics
 * come from the same shared engine the leaders use, so a master sees exactly
 * what a leader sees, across every group, plus leader accountability and
 * guidance for leading the leaders.
 *
 * Privacy: members' private content is never read here either.
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
      guidance: GuidanceCard[];
    }
  | { state: 'not-master' }
  | { state: 'no-groups' };

export interface MasterGroupDetail {
  orgId: string;
  orgName: string;
  leaders: LeaderActivity[];
  group: GroupAnalytics;
  members: MemberSummary[];
}

function daysSinceTs(ts: number | null): number | null {
  if (!ts) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
}

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

  // Derive master guidance signals: quiet leaders, drifting groups, unreached people.
  const quietLeaders: { name: string; group: string; days: number | null }[] = [];
  const driftingGroups: { name: string; leaderNames: string[]; participation: number }[] = [];
  let unreachedTotal = 0;
  for (const o of overviews) {
    const part = o.memberCount > 0 ? o.group.activeThisWeek / o.memberCount : 0;
    if (o.memberCount > 0 && part < 0.5) {
      driftingGroups.push({
        name: o.orgName,
        leaderNames: o.leaders.map((l) => l.name),
        participation: Math.round(part * 100),
      });
    }
    unreachedTotal += o.members.filter((m) => m.attention).length;
    for (const l of o.leaders) {
      const d = daysSinceTs(l.lastActiveAt ?? l.lastSignInAt);
      if (d === null || d >= 7) quietLeaders.push({ name: l.name, group: o.orgName, days: d });
    }
  }

  const guidance = guidanceForMaster({
    quietLeaders,
    driftingGroups,
    unreachedTotal,
    groupCount: overviews.length,
  });

  return { state: 'ready', groups: overviews, totals, guidance };
}

/** Full detail for one group, for the master drill-in. Reuses the leader's group view. */
export async function getGroupForMaster(orgId: string): Promise<MasterGroupDetail | null> {
  if (!(await isMaster())) return null;
  const groups = await getAllGroups();
  const g = groups.find((x) => x.orgId === orgId);
  if (!g) return null;
  const { summaries, group } = await computeGroup(g.members);
  return { orgId: g.orgId, orgName: g.orgName, leaders: g.leaders, group, members: summaries };
}

export async function getMemberForMaster(memberId: string): Promise<MemberDetail | null> {
  if (!(await isMaster())) return null;
  const member = await findMember(memberId);
  if (!member) return null;
  return computeMemberDetail(member);
}
