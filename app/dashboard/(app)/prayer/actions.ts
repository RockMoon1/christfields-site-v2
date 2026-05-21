'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type PrayerRequest } from '@/lib/supabase';
import { PRAYER_CATEGORIES } from '@/lib/dashboard/content';

/**
 * Server actions for the Prayer feature.
 *
 * Every action authenticates with Clerk first. The signed-in user's Clerk ID
 * scopes every query so no user can ever read or modify another user's data.
 * The Supabase service-role key never reaches the browser.
 *
 * Read actions (getPrayers) always try/catch and return safe defaults so the
 * page renders gracefully even when the table does not exist yet.
 *
 * Note: the category list lives in lib/dashboard/content.ts, not here, because
 * a "use server" file may only export async functions.
 */

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

/** Load this user's prayer requests split by status. Safe on missing table. */
export async function getPrayers(): Promise<{
  open: PrayerRequest[];
  answered: PrayerRequest[];
}> {
  try {
    const { userId } = await auth();
    if (!userId) return { open: [], answered: [] };

    const sb = getSupabase();
    const { data, error } = await sb
      .from('prayer_requests')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getPrayers: query failed', error);
      return { open: [], answered: [] };
    }

    const rows = (data as PrayerRequest[]) ?? [];
    return {
      open: rows.filter((r) => r.status === 'open'),
      answered: rows.filter((r) => r.status === 'answered'),
    };
  } catch (err) {
    console.error('getPrayers: unexpected failure', err);
    return { open: [], answered: [] };
  }
}

/** Add a new open prayer request for the signed-in user. */
export async function addPrayer(input: {
  title: string;
  body: string;
  category: string;
}): Promise<PrayerRequest> {
  const userId = await requireUser();
  if (!input.title.trim()) throw new Error('Title is required');

  const sb = getSupabase();
  const { data, error } = await sb
    .from('prayer_requests')
    .insert({
      clerk_user_id: userId,
      title: input.title.trim().slice(0, 200),
      body: input.body.trim().slice(0, 2000),
      category: PRAYER_CATEGORIES.includes(input.category as (typeof PRAYER_CATEGORIES)[number])
        ? input.category
        : 'general',
      status: 'open',
      answered_note: '',
      answered_at: null,
      shared: false,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Insert returned no row');

  revalidatePath('/dashboard/prayer');
  revalidatePath('/dashboard');

  return data as PrayerRequest;
}

/** Update the title, body, or category of an owned prayer request. */
export async function updatePrayer(
  id: string,
  patch: { title?: string; body?: string; category?: string },
) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: existing, error: ownerErr } = await sb
    .from('prayer_requests')
    .select('id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (ownerErr) throw ownerErr;
  if (!existing) throw new Error('Prayer request not found');

  const updates: Record<string, string> = {};
  if (patch.title !== undefined) updates.title = patch.title.trim().slice(0, 200);
  if (patch.body !== undefined) updates.body = patch.body.trim().slice(0, 2000);
  if (patch.category !== undefined) {
    updates.category = PRAYER_CATEGORIES.includes(patch.category as (typeof PRAYER_CATEGORIES)[number])
      ? patch.category
      : 'general';
  }

  const { error } = await sb
    .from('prayer_requests')
    .update(updates)
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/prayer');
  revalidatePath('/dashboard');
}

/** Mark a prayer request as answered, with an optional note on how God moved. */
export async function markAnswered(id: string, answeredNote: string) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: existing, error: ownerErr } = await sb
    .from('prayer_requests')
    .select('id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (ownerErr) throw ownerErr;
  if (!existing) throw new Error('Prayer request not found');

  const { error } = await sb
    .from('prayer_requests')
    .update({
      status: 'answered',
      answered_at: new Date().toISOString(),
      answered_note: answeredNote.trim().slice(0, 1000),
    })
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/prayer');
  revalidatePath('/dashboard');
}

/** Move an answered request back to open so you can keep praying. */
export async function reopenPrayer(id: string) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: existing, error: ownerErr } = await sb
    .from('prayer_requests')
    .select('id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (ownerErr) throw ownerErr;
  if (!existing) throw new Error('Prayer request not found');

  const { error } = await sb
    .from('prayer_requests')
    .update({
      status: 'open',
      answered_at: null,
      answered_note: '',
    })
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/prayer');
  revalidatePath('/dashboard');
}

/** Permanently remove a prayer request. */
export async function deletePrayer(id: string) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: existing, error: ownerErr } = await sb
    .from('prayer_requests')
    .select('id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (ownerErr) throw ownerErr;
  if (!existing) throw new Error('Prayer request not found');

  const { error } = await sb
    .from('prayer_requests')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/prayer');
  revalidatePath('/dashboard');
}

/**
 * Copy a prayer request to the community wall. Sets shared = true on the
 * original. Fails quietly if the community_prayers table does not exist yet
 * so the request keeps processing normally.
 */
export async function shareToCommunity(id: string) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: existing, error: ownerErr } = await sb
    .from('prayer_requests')
    .select('*')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (ownerErr) throw ownerErr;
  if (!existing) throw new Error('Prayer request not found');

  const request = existing as PrayerRequest;

  try {
    const user = await currentUser();
    const authorName = user?.firstName ? user.firstName : 'A member';

    await sb.from('community_prayers').insert({
      clerk_user_id: userId,
      author_name: authorName,
      title: request.title,
      body: request.body,
    });
  } catch (err) {
    // Community table may not exist yet. Log and continue.
    console.warn('shareToCommunity: community insert failed (table may be missing)', err);
  }

  // Mark the original as shared even if the community insert failed,
  // so the UI state stays consistent with intent.
  const { error: updateErr } = await sb
    .from('prayer_requests')
    .update({ shared: true })
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (updateErr) throw updateErr;

  revalidatePath('/dashboard/prayer');
  revalidatePath('/dashboard/community');
}
