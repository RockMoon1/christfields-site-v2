/**
 * FaithFlow organization role keys, matching the custom roles configured in
 * Clerk:
 *   org:leader  -> a group leader (sees their own group)
 *   org:member  -> a student
 *
 * org:admin is kept in the leader set as a fallback, so the default Clerk
 * creator role (org:admin) still counts as a leader if an organization uses it.
 */

export const LEADER_ROLES: readonly string[] = ['org:leader', 'org:admin'];

export function isLeaderRole(role: string | null | undefined): boolean {
  return !!role && LEADER_ROLES.includes(role);
}
