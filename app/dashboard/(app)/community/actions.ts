'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type CommunityPrayer, type CommunityIntercession } from '@/lib/supabase';
import { notifyPrayer } from '@/lib/notify/prayer';

/**
 * Server actions for the Community prayer wall.
 *
 * All writes are scoped by Clerk user ID. Reads are community-wide (that is
 * the point: everyone can see and pray for each other's requests). No data
 * ever reaches the browser via the service-role client.
 */

/* ============================================================
   Helper
   ============================================================ */

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

/* ============================================================
   View type: CommunityPrayer + per-viewer flags
   ============================================================ */

/**
 * A wall post as other members may see it. clerk_user_id is deliberately
 * omitted: this payload is sent to every signed-in browser, and nothing in the
 * UI needs to know who authored a post beyond the display name they chose and
 * the `mine` flag computed here on the server.
 */
export interface CommunityPrayerView extends Omit<CommunityPrayer, 'clerk_user_id'> {
  /** True when the current user has already tapped "I prayed for this". */
  prayedByMe: boolean;
  /** True when the row belongs to the current user. */
  mine: boolean;
}

/* ============================================================
   Read: load the wall
   ============================================================ */

export async function getCommunity(): Promise<{
  prayers: CommunityPrayerView[];
  totalPrayed: number;
  totalRequests: number;
}> {
  const empty = { prayers: [], totalPrayed: 0, totalRequests: 0 };

  try {
    const { userId } = await auth();
    if (!userId) return empty;

    const sb = getSupabase();

    const { data: rows, error: pErr } = await sb
      .from('community_prayers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (pErr) {
      console.error('getCommunity: prayers query failed', pErr);
      return empty;
    }

    const prayers = (rows as CommunityPrayer[]) ?? [];
    if (prayers.length === 0) return empty;

    // Load this user's intercessions to compute prayedByMe.
    const prayerIds = prayers.map((p) => p.id);
    const { data: intercessions, error: iErr } = await sb
      .from('community_intercessions')
      .select('community_prayer_id')
      .eq('clerk_user_id', userId)
      .in('community_prayer_id', prayerIds);

    if (iErr) {
      console.error('getCommunity: intercessions query failed', iErr);
      // Still render the wall, just without prayedByMe state.
    }

    const prayedSet = new Set(
      ((intercessions as Pick<CommunityIntercession, 'community_prayer_id'>[] | null) ?? []).map(
        (r) => r.community_prayer_id,
      ),
    );

    const views: CommunityPrayerView[] = prayers.map((p) => {
      // Explicit field list rather than a spread: a spread would ship every
      // author's clerk_user_id to every member's browser.
      const { clerk_user_id, ...safe } = p;
      return {
        ...safe,
        prayedByMe: prayedSet.has(p.id),
        mine: clerk_user_id === userId,
      };
    });

    // The wall shows the latest 60, but "we have prayed for one another N
    // times" is a claim about the whole community, so count across every row
    // rather than just the page we loaded.
    const { count: interceptionCount } = await sb
      .from('community_intercessions')
      .select('id', { count: 'exact', head: true });
    const { count: requestCount } = await sb
      .from('community_prayers')
      .select('id', { count: 'exact', head: true });

    const totalPrayed =
      interceptionCount ?? views.reduce((sum, p) => sum + (p.pray_count ?? 0), 0);

    return { prayers: views, totalPrayed, totalRequests: requestCount ?? views.length };
  } catch (err) {
    console.error('getCommunity: unexpected failure', err);
    return empty;
  }
}

/* ============================================================
   Write: post a new prayer request
   ============================================================ */

export async function postCommunityPrayer(input: {
  title: string;
  body: string;
}): Promise<CommunityPrayerView> {
  const userId = await requireUser();

  const title = input.title.trim().slice(0, 120);
  if (!title) throw new Error('A title is required.');

  const body = input.body.trim().slice(0, 600);

  // Resolve author display name from Clerk.
  const user = await currentUser();
  const authorName = user?.firstName?.trim() || 'A member';

  const sb = getSupabase();

  const { data, error } = await sb
    .from('community_prayers')
    .insert({
      clerk_user_id: userId,
      author_name: authorName,
      title,
      body,
      pray_count: 0,
      answered: false,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Insert returned no row');

  // One phone alert to the poster's groups; never fails the post.
  const saved = data as CommunityPrayer;
  await notifyPrayer('posted', { id: saved.id, title: saved.title, authorName: authorName, authorId: userId });

  revalidatePath('/dashboard/community');
  revalidatePath('/dashboard');

  return { ...saved, prayedByMe: false, mine: true };
}

/* ============================================================
   Write: intercede (pray) for another person's request
   ============================================================ */

export async function prayForCommunity(
  communityPrayerId: string,
): Promise<{ ok: boolean }> {
  const userId = await requireUser();
  const sb = getSupabase();

  const { error: insertErr } = await sb.from('community_intercessions').insert({
    community_prayer_id: communityPrayerId,
    clerk_user_id: userId,
  });

  if (insertErr) {
    // Unique constraint violation means the user already prayed. That is fine.
    if (
      insertErr.code === '23505' ||
      insertErr.message?.toLowerCase().includes('unique') ||
      insertErr.message?.toLowerCase().includes('duplicate')
    ) {
      return { ok: true };
    }
    throw insertErr;
  }

  // Increment pray_count. Read-then-write keeps the value accurate without
  // needing a DB function. The wall is low-traffic so a small race is fine.
  const { data: current } = await sb
    .from('community_prayers')
    .select('pray_count')
    .eq('id', communityPrayerId)
    .maybeSingle();

  const nextCount = ((current as { pray_count: number } | null)?.pray_count ?? 0) + 1;

  await sb
    .from('community_prayers')
    .update({ pray_count: nextCount })
    .eq('id', communityPrayerId);

  revalidatePath('/dashboard/community');
  revalidatePath('/dashboard');

  return { ok: true };
}

/* ============================================================
   Write: mark a request answered (author only)
   ============================================================ */

export async function markCommunityAnswered(id: string): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();

  // Ownership check.
  const { data: row, error: fetchErr } = await sb
    .from('community_prayers')
    .select('clerk_user_id, title, author_name, answered')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error('Prayer not found');
  const prayer = row as { clerk_user_id: string; title: string; author_name: string; answered: boolean };
  if (prayer.clerk_user_id !== userId) {
    throw new Error('Only the author can mark a prayer answered');
  }

  const { error } = await sb
    .from('community_prayers')
    .update({ answered: true })
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  if (!prayer.answered) {
    await notifyPrayer('answered', { id, title: prayer.title, authorName: prayer.author_name, authorId: userId });
  }

  revalidatePath('/dashboard/community');
  revalidatePath('/dashboard');
}

/* ============================================================
   Write: delete a request (author only)
   ============================================================ */

export async function deleteCommunityPrayer(id: string): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: row, error: fetchErr } = await sb
    .from('community_prayers')
    .select('clerk_user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error('Prayer not found');
  if ((row as { clerk_user_id: string }).clerk_user_id !== userId) {
    throw new Error('Only the author can delete a prayer');
  }

  const { error } = await sb
    .from('community_prayers')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/community');
  revalidatePath('/dashboard');
}
