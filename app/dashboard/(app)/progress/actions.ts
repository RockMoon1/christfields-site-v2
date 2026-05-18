'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type ProgressArea, type ProgressEntry } from '@/lib/supabase';

/**
 * Server actions for the Progress feature.
 *
 * Every action authenticates with Clerk first. The signed-in user's Clerk ID
 * is used to scope every query, so no user can ever see or modify another
 * user's data. The Supabase service-role key never reaches the browser.
 */

export interface AreaWithEntries {
  id: string;
  name: string;
  description: string;
  entries: { score: number; date: string }[];
}

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

/**
 * Load every area the user has, with all their entries attached.
 * Returns an empty array on any failure (missing env vars, missing tables,
 * network issues) instead of throwing, so the dashboard can still render
 * even when the database is misconfigured. Real errors are logged server-side.
 */
export async function getAreas(): Promise<AreaWithEntries[]> {
  try {
    const userId = await requireUser();
    const sb = getSupabase();

    const { data: areas, error: areasErr } = await sb
      .from('progress_areas')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: true });

    if (areasErr) {
      console.error('getAreas: failed to load areas', areasErr);
      return [];
    }
    if (!areas || areas.length === 0) return [];

    const areaIds = (areas as ProgressArea[]).map((a) => a.id);
    const { data: entries, error: entriesErr } = await sb
      .from('progress_entries')
      .select('*')
      .in('area_id', areaIds)
      .order('logged_at', { ascending: true });

    if (entriesErr) {
      console.error('getAreas: failed to load entries', entriesErr);
      // Still return areas, just without entries
      return (areas as ProgressArea[]).map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        entries: [],
      }));
    }

    const byArea = new Map<string, { score: number; date: string }[]>();
    for (const e of (entries as ProgressEntry[]) || []) {
      const list = byArea.get(e.area_id) || [];
      list.push({ score: e.score, date: e.logged_at.split('T')[0] });
      byArea.set(e.area_id, list);
    }

    return (areas as ProgressArea[]).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      entries: byArea.get(a.id) || [],
    }));
  } catch (err) {
    console.error('getAreas: unexpected failure', err);
    return [];
  }
}

/** Add a new area for the signed-in user. */
export async function createArea(name: string, description: string) {
  const userId = await requireUser();
  if (!name.trim()) throw new Error('Area name required');

  const sb = getSupabase();
  const { error } = await sb.from('progress_areas').insert({
    clerk_user_id: userId,
    name: name.trim().slice(0, 100),
    description: description.trim().slice(0, 500),
  });
  if (error) throw error;

  revalidatePath('/dashboard/progress');
  revalidatePath('/dashboard');
}

/** Log a new 1-10 score against an area. Verifies area belongs to user. */
export async function logScore(areaId: string, score: number) {
  const userId = await requireUser();
  if (score < 1 || score > 10) throw new Error('Score must be 1-10');

  const sb = getSupabase();

  // Confirm the area belongs to this user before writing.
  const { data: area, error: ownerErr } = await sb
    .from('progress_areas')
    .select('id')
    .eq('id', areaId)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (ownerErr) throw ownerErr;
  if (!area) throw new Error('Area not found');

  const { error } = await sb.from('progress_entries').insert({
    area_id: areaId,
    score: Math.round(score),
  });
  if (error) throw error;

  revalidatePath('/dashboard/progress');
  revalidatePath('/dashboard');
}

/** Delete an area (cascade deletes its entries). Owner check enforced. */
export async function deleteArea(areaId: string) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { error } = await sb
    .from('progress_areas')
    .delete()
    .eq('id', areaId)
    .eq('clerk_user_id', userId);
  if (error) throw error;

  revalidatePath('/dashboard/progress');
  revalidatePath('/dashboard');
}
