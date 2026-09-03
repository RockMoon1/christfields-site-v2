/**
 * Leader authorization lives in lib/groups/membership.ts now (the single
 * tenant boundary). This module stays as a thin re-export so older imports
 * keep working while the rewrite settles.
 */
export { isLeaderAnywhere, ledOrgs, requireLeaderOf } from '@/lib/groups/membership';
export type { LeaderContext, GroupMember } from '@/lib/groups/membership';
