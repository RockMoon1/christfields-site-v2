import { clerkClient, currentUser } from '@clerk/nextjs/server';
import type { OrgMember } from './types';
import { isLeaderRole, isMasterRole } from './roles';

/**
 * The master tier sits above leaders. A master oversees every group across the
 * whole instance, for accountability and transparency.
 *
 * A user is a master if they hold the org:master role in any organization, OR
 * they are flagged on their Clerk user (publicMetadata.role === 'master', or
 * privateMetadata, or the MASTER_USER_IDS env allowlist). org:master is
 * instance-wide power, so grant it carefully.
 */

export interface LeaderActivity {
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  lastSignInAt: number | null;
  lastActiveAt: number | null;
  createdAt: number | null;
}

export interface MasterGroup {
  orgId: string;
  orgName: string;
  orgSlug: string | null;
  members: OrgMember[];
  leaders: LeaderActivity[];
}

function metaSaysMaster(meta: unknown): boolean {
  if (!meta || typeof meta !== 'object') return false;
  const m = meta as Record<string, unknown>;
  return m.role === 'master' || m.master === true;
}

/** True if the signed-in user is a master. */
export async function isMaster(): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) return false;
    if (metaSaysMaster(user.publicMetadata) || metaSaysMaster(user.privateMetadata)) return true;

    const allow = (process.env.MASTER_USER_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allow.includes(user.id)) return true;

    // Or holds the org:master role in any organization.
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({ userId: user.id });
    return res.data.some((m) => isMasterRole(m.role));
  } catch {
    return false;
  }
}

function membershipToMember(
  role: string,
  pud: {
    userId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    identifier?: string | null;
    imageUrl?: string | null;
  } | null,
): OrgMember {
  const name =
    [pud?.firstName, pud?.lastName].filter(Boolean).join(' ') || pud?.identifier || 'Member';
  return {
    userId: pud?.userId ?? '',
    name,
    email: pud?.identifier ?? '',
    imageUrl: pud?.imageUrl ?? '',
    role,
    isLeader: isLeaderRole(role),
  };
}

/** Fetch Clerk activity (sign-in, last active) for a leader, gracefully. */
async function leaderActivity(
  client: Awaited<ReturnType<typeof clerkClient>>,
  m: OrgMember,
): Promise<LeaderActivity> {
  const base: LeaderActivity = {
    userId: m.userId,
    name: m.name,
    email: m.email,
    imageUrl: m.imageUrl,
    lastSignInAt: null,
    lastActiveAt: null,
    createdAt: null,
  };
  try {
    const u = await client.users.getUser(m.userId);
    const lastActiveAt = (u as unknown as { lastActiveAt?: number | null }).lastActiveAt ?? null;
    return {
      ...base,
      lastSignInAt: u.lastSignInAt ?? null,
      lastActiveAt,
      createdAt: u.createdAt ?? null,
    };
  } catch {
    return base;
  }
}

/** All groups (organizations) across the instance, with members and leader activity. */
export async function getAllGroups(): Promise<MasterGroup[]> {
  try {
    const client = await clerkClient();
    const orgList = await client.organizations.getOrganizationList({ limit: 200 });

    const groups: MasterGroup[] = [];
    for (const org of orgList.data) {
      const memberships = await client.organizations.getOrganizationMembershipList({
        organizationId: org.id,
        limit: 100,
      });
      const members = memberships.data
        .map((mem) => membershipToMember(mem.role, mem.publicUserData ?? null))
        .filter((m) => m.userId);
      const leaderMembers = members.filter((m) => m.isLeader);
      const leaders = await Promise.all(leaderMembers.map((lm) => leaderActivity(client, lm)));
      groups.push({ orgId: org.id, orgName: org.name, orgSlug: org.slug, members, leaders });
    }
    return groups;
  } catch (err) {
    console.error('getAllGroups failed', err);
    return [];
  }
}

/** Find the org member record for a user id, across all groups (for authz + detail). */
export async function findMember(memberId: string): Promise<OrgMember | null> {
  const groups = await getAllGroups();
  for (const g of groups) {
    const m = g.members.find((mm) => mm.userId === memberId);
    if (m) return m;
  }
  return null;
}
