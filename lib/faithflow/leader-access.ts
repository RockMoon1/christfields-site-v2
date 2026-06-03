import { auth, clerkClient } from '@clerk/nextjs/server';
import type { OrgMember } from './types';
import { isLeaderRole } from './roles';

/**
 * Clerk Organizations power FaithFlow groups: an organization is a group, a
 * leader holds org:leader, members are students.
 * This module is the single place that decides who is a leader and which
 * members a leader may view.
 *
 * Authorization rule: a leader may only see members of an organization where
 * they hold a leader role, and only for the organization currently active in
 * their session.
 */

export interface LeaderContext {
  orgId: string;
  orgName: string;
  orgSlug: string | null;
  members: OrgMember[];
}

/** True if the user holds a leader role in their currently active organization. */
export async function isActiveLeader(): Promise<boolean> {
  try {
    const { orgId, orgRole } = await auth();
    return Boolean(orgId) && isLeaderRole(orgRole);
  } catch {
    return false;
  }
}

/**
 * True if the user is a leader of ANY organization. Used to decide whether to
 * show the leader entry in the member dashboard, even if no org is active yet.
 */
export async function isLeaderAnywhere(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({ userId });
    return res.data.some((m) => isLeaderRole(m.role));
  } catch {
    return false;
  }
}

/**
 * Returns the active organization plus its members, but only if the signed-in
 * user holds a leader role in that organization. Returns null otherwise.
 */
export async function getLeaderContext(): Promise<LeaderContext | null> {
  try {
    const { userId, orgId, orgRole } = await auth();
    if (!userId || !orgId || !isLeaderRole(orgRole)) return null;

    const client = await clerkClient();
    const [org, memberships] = await Promise.all([
      client.organizations.getOrganization({ organizationId: orgId }),
      client.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
    ]);

    const members: OrgMember[] = memberships.data
      .map((m) => {
        const pud = m.publicUserData;
        const name =
          [pud?.firstName, pud?.lastName].filter(Boolean).join(' ') ||
          pud?.identifier ||
          'Member';
        return {
          userId: pud?.userId ?? '',
          name,
          email: pud?.identifier ?? '',
          imageUrl: pud?.imageUrl ?? '',
          role: m.role,
          isLeader: isLeaderRole(m.role),
        };
      })
      .filter((m) => m.userId);

    return { orgId, orgName: org.name, orgSlug: org.slug, members };
  } catch (err) {
    console.error('getLeaderContext failed', err);
    return null;
  }
}

/**
 * Authorization gate for individual member data. True only if the requester is
 * a leader of the active org AND the target member belongs to it.
 */
export async function canViewMember(memberId: string): Promise<boolean> {
  const ctx = await getLeaderContext();
  if (!ctx) return false;
  return ctx.members.some((m) => m.userId === memberId);
}
