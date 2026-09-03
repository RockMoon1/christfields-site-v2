/**
 * Shared types for the FaithFlow group roster.
 *
 * Privacy note: these shapes only ever carry roster identity a member has
 * already shared with their group (name, photo). Nothing personal beyond that.
 */

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  role: string;
  isLeader: boolean;
}
