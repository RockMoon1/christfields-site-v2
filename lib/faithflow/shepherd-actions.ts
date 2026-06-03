'use server';

import { revalidatePath } from 'next/cache';
import { getSupabase } from '@/lib/supabase';
import { canViewMember } from './leader-access';

/**
 * Shepherding actions: a leader (of the member's active group) may act on a
 * member's Scripture memory, for accountability. They can clear a verse a member
 * is not ready on, or send it back to learning so the member can pick it up
 * again. Authorization is always checked first, and the verse must belong to the
 * named member.
 */

async function canShepherd(memberId: string): Promise<boolean> {
  return canViewMember(memberId);
}

/** Remove a verse from a member's dashboard (e.g. after a test they were not ready for). */
export async function removeMemberVerse(
  memberId: string,
  verseId: string,
): Promise<{ ok: boolean }> {
  if (!(await canShepherd(memberId))) return { ok: false };
  const sb = getSupabase();
  const { error } = await sb
    .from('memory_verses')
    .delete()
    .eq('id', verseId)
    .eq('clerk_user_id', memberId);
  if (error) return { ok: false };

  revalidatePath('/dashboard/leader/members');
  return { ok: true };
}

/** Send a verse back to learning (a gentler option than removing it). */
export async function resetMemberVerse(
  memberId: string,
  verseId: string,
): Promise<{ ok: boolean }> {
  if (!(await canShepherd(memberId))) return { ok: false };
  const sb = getSupabase();
  const { error } = await sb
    .from('memory_verses')
    .update({ status: 'learning', reviews: 0, last_reviewed: null })
    .eq('id', verseId)
    .eq('clerk_user_id', memberId);
  if (error) return { ok: false };

  revalidatePath('/dashboard/leader/members');
  return { ok: true };
}
