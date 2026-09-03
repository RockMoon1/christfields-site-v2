import { cache } from 'react';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isLeaderRole } from '@/lib/faithflow/roles';

/**
 * The single tenant boundary.
 *
 * Groups are Clerk organizations. Every query in this app runs with the Supabase
 * service-role key, so nothing in the database stops one group's data reaching
 * another group's member except the checks in this file. Rules:
 *
 *  - This is the only file that READS Clerk organization APIs. (The Clerk
 *    webhook in app/api/clerk-webhook is the one writer: auto-enrol.)
 *  - Every member read of events/rsvps/attendance passes assertMemberOf().
 *  - Every leader write passes requireLeaderOf().
 *  - Leader orgs come from the member's own memberships, never from the
 *    session's active org, which is often null on a phone.
 *
 * Everything is wrapped in React cache() so a page and its actions pay one
 * Clerk round trip per request, not one per call.
 */

export interface Membership {
  orgId: string;
  orgName: string;
  orgSlug: string | null;
  role: string;
  isLeader: boolean;
  /** When this person joined the org (ms since epoch), for first-timer logic. */
  joinedAtMs: number;
}

export interface GroupMember {
  userId: string;
  name: string;
  firstName: string;
  email: string;
  imageUrl: string;
  role: string;
  isLeader: boolean;
  joinedAtMs: number;
}

export interface LeaderContext {
  orgId: string;
  orgName: string;
  members: GroupMember[];
}

/** Every org the signed-in user belongs to. Empty when signed out or on error. */
export const getMyMemberships = cache(async (): Promise<Membership[]> => {
  try {
    const { userId } = await auth();
    if (!userId) return [];
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    return res.data.map((m) => ({
      orgId: m.organization.id,
      orgName: m.organization.name,
      orgSlug: m.organization.slug ?? null,
      role: m.role,
      isLeader: isLeaderRole(m.role),
      joinedAtMs: typeof m.createdAt === 'number' ? m.createdAt : Date.parse(String(m.createdAt)) || 0,
    }));
  } catch (err) {
    console.error('getMyMemberships failed', err);
    return [];
  }
});

export async function getMyOrgIds(): Promise<string[]> {
  return (await getMyMemberships()).map((m) => m.orgId);
}

/** The orgs where the signed-in user holds a leader role. */
export async function ledOrgs(): Promise<Membership[]> {
  return (await getMyMemberships()).filter((m) => m.isLeader);
}

export async function isLeaderAnywhere(): Promise<boolean> {
  return (await ledOrgs()).length > 0;
}

/** True only if the signed-in user belongs to the org. The member read gate. */
export async function assertMemberOf(orgId: string): Promise<boolean> {
  if (!orgId) return false;
  return (await getMyMemberships()).some((m) => m.orgId === orgId);
}

/**
 * The full roster of an org, paged 100 at a time (a single call once truncated
 * the main community). Request-cached per org.
 */
export const getGroupMembers = cache(async (orgId: string): Promise<GroupMember[]> => {
  try {
    const client = await clerkClient();
    const pageSize = 100;
    const rows: Awaited<
      ReturnType<typeof client.organizations.getOrganizationMembershipList>
    >['data'] = [];
    for (let offset = 0; rows.length < 1000; offset += pageSize) {
      const page = await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: pageSize,
        offset,
      });
      rows.push(...page.data);
      if (page.data.length < pageSize) break;
    }
    return rows
      .map((m) => {
        const pud = m.publicUserData;
        const firstName = pud?.firstName ?? '';
        const name =
          [pud?.firstName, pud?.lastName].filter(Boolean).join(' ') || pud?.identifier || 'Member';
        return {
          userId: pud?.userId ?? '',
          name,
          firstName: firstName || name.split(' ')[0] || 'Member',
          email: pud?.identifier ?? '',
          imageUrl: pud?.imageUrl ?? '',
          role: m.role,
          isLeader: isLeaderRole(m.role),
          joinedAtMs: typeof m.createdAt === 'number' ? m.createdAt : Date.parse(String(m.createdAt)) || 0,
        };
      })
      .filter((m) => m.userId);
  } catch (err) {
    console.error('getGroupMembers failed', err);
    return [];
  }
});

/**
 * The leader write gate: the org plus its roster, only if the signed-in user
 * leads that org. Null otherwise. Never reads auth().orgId.
 */
export async function requireLeaderOf(orgId: string): Promise<LeaderContext | null> {
  if (!orgId) return null;
  const membership = (await getMyMemberships()).find((m) => m.orgId === orgId && m.isLeader);
  if (!membership) return null;
  const members = await getGroupMembers(orgId);
  return { orgId, orgName: membership.orgName, members };
}

/** Name lookup for one org, cheap because the roster is cached. */
export async function memberNames(orgId: string): Promise<Map<string, GroupMember>> {
  const members = await getGroupMembers(orgId);
  return new Map(members.map((m) => [m.userId, m]));
}

/* ============================================================
   For routes that act on behalf of a member identified by a token or a feed
   secret rather than a session. Not request-cached (the caller varies).
   ============================================================ */

export async function orgsForUser(userId: string): Promise<{ orgId: string; orgName: string }[]> {
  try {
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    return res.data.map((m) => ({ orgId: m.organization.id, orgName: m.organization.name }));
  } catch (err) {
    console.error('orgsForUser failed', err);
    return [];
  }
}

export async function userIsMemberOf(userId: string, orgId: string): Promise<boolean> {
  if (!userId || !orgId) return false;
  return (await orgsForUser(userId)).some((o) => o.orgId === orgId);
}

/** The display name of a group, request-cached. */
export const orgName = cache(async (orgId: string): Promise<string> => {
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({ organizationId: orgId });
    return org.name;
  } catch {
    return 'Christ Fields';
  }
});
