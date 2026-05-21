/**
 * FaithFlow organization role keys, matching the custom roles configured in
 * Clerk:
 *   org:leader  -> a group leader (sees their own group)
 *   org:master  -> full oversight (sees every group; the tier above leaders)
 *   org:member  -> a student
 *
 * org:admin is kept in the leader set as a fallback, so the default Clerk
 * creator role still counts as a leader if any organization uses it.
 *
 * A master is anyone holding org:master in any organization, or anyone flagged
 * via Clerk user metadata (publicMetadata.role === 'master') or the
 * MASTER_USER_IDS env allowlist. Treat org:master as instance-wide power: it
 * sees everything, so assign it carefully.
 */

export const MASTER_ROLE = 'org:master';

export const LEADER_ROLES: readonly string[] = ['org:leader', 'org:master', 'org:admin'];

export function isLeaderRole(role: string | null | undefined): boolean {
  return !!role && LEADER_ROLES.includes(role);
}

export function isMasterRole(role: string | null | undefined): boolean {
  return role === MASTER_ROLE;
}
