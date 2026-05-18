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
  whyItMatters: string;
  targetScore: number | null;
  presetKey: string | null;
  entries: { score: number; date: string; note: string }[];
}

/* ============================================================
   Presets. Auto-created the first time a user loads their
   dashboard. Cannot be deleted (UI hides the delete button and
   the deleteArea action refuses to remove them).
   ============================================================ */

interface PresetDef {
  key: string;
  name: string;
  description: string;
  whyItMatters: string;
  targetScore: number;
}

const PRESETS: PresetDef[] = [
  {
    key: 'presence',
    name: 'Presence',
    description: 'Showing up to group, in person.',
    whyItMatters: 'Community needs your presence, not just your attention.',
    targetScore: 8,
  },
  {
    key: 'honesty',
    name: 'Honesty',
    description: 'Telling the truth about your week.',
    whyItMatters: 'You cannot fake your way through a group like this. The people next to you eventually know.',
    targetScore: 8,
  },
  {
    key: 'scripture',
    name: 'Scripture',
    description: 'Reading and reflecting on the Word.',
    whyItMatters: 'Reading slowly, together, makes Scripture bigger than we usually treat it.',
    targetScore: 7,
  },
  {
    key: 'prayer',
    name: 'Prayer',
    description: 'For others and for yourself.',
    whyItMatters: 'Praying for each other by name changes things in ways you cannot predict.',
    targetScore: 7,
  },
  {
    key: 'sharpening',
    name: 'Sharpening',
    description: 'Pushing someone else toward growth.',
    whyItMatters: 'As iron sharpens iron, so one person sharpens another.',
    targetScore: 7,
  },
];

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

/**
 * Idempotent: ensures all preset areas exist for this user. Called before
 * every getAreas() so a fresh account, or one that pre-dates new presets,
 * always sees them on next page load.
 */
async function ensurePresets(userId: string) {
  const sb = getSupabase();

  const { data: existing } = await sb
    .from('progress_areas')
    .select('preset_key')
    .eq('clerk_user_id', userId)
    .not('preset_key', 'is', null);

  const have = new Set((existing as { preset_key: string }[] | null)?.map((r) => r.preset_key) || []);
  const missing = PRESETS.filter((p) => !have.has(p.key));
  if (missing.length === 0) return;

  await sb.from('progress_areas').insert(
    missing.map((p) => ({
      clerk_user_id: userId,
      preset_key: p.key,
      name: p.name,
      description: p.description,
      why_it_matters: p.whyItMatters,
      target_score: p.targetScore,
    })),
  );
}

/**
 * Load every area the user has, with all their entries attached. Auto-seeds
 * preset areas if missing. Returns an empty array on any database failure so
 * the dashboard still renders.
 */
export async function getAreas(): Promise<AreaWithEntries[]> {
  try {
    const userId = await requireUser();
    await ensurePresets(userId);
    const sb = getSupabase();

    const { data: areas, error: areasErr } = await sb
      .from('progress_areas')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('preset_key', { ascending: true, nullsFirst: false }) // presets first
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
      return (areas as ProgressArea[]).map(toAreaWithEntries);
    }

    const byArea = new Map<string, { score: number; date: string; note: string }[]>();
    for (const e of (entries as ProgressEntry[]) || []) {
      const list = byArea.get(e.area_id) || [];
      list.push({
        score: e.score,
        date: e.logged_at.split('T')[0],
        note: e.note || '',
      });
      byArea.set(e.area_id, list);
    }

    return (areas as ProgressArea[]).map((a) => ({
      ...toAreaWithEntries(a),
      entries: byArea.get(a.id) || [],
    }));
  } catch (err) {
    console.error('getAreas: unexpected failure', err);
    return [];
  }
}

function toAreaWithEntries(a: ProgressArea): AreaWithEntries {
  return {
    id: a.id,
    name: a.name,
    description: a.description || '',
    whyItMatters: a.why_it_matters || '',
    targetScore: a.target_score,
    presetKey: a.preset_key,
    entries: [],
  };
}

/** Add a new (non-preset) area for the signed-in user. */
export async function createArea(input: {
  name: string;
  description: string;
  whyItMatters: string;
  targetScore: number;
}): Promise<AreaWithEntries> {
  const userId = await requireUser();
  if (!input.name.trim()) throw new Error('Area name required');

  const sb = getSupabase();
  const { data, error } = await sb
    .from('progress_areas')
    .insert({
      clerk_user_id: userId,
      name: input.name.trim().slice(0, 100),
      description: input.description.trim().slice(0, 500),
      why_it_matters: input.whyItMatters.trim().slice(0, 500),
      target_score: clamp(input.targetScore, 1, 10),
      preset_key: null,
    })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Insert returned no row');

  revalidatePath('/dashboard/progress');
  revalidatePath('/dashboard');

  return { ...toAreaWithEntries(data as ProgressArea), entries: [] };
}

/** Log a 1-10 score against an area, optionally with a reflection note. */
export async function logScore(areaId: string, score: number, note: string) {
  const userId = await requireUser();
  if (score < 1 || score > 10) throw new Error('Score must be 1-10');

  const sb = getSupabase();

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
    note: note.trim().slice(0, 280),
  });
  if (error) throw error;

  revalidatePath('/dashboard/progress');
  revalidatePath('/dashboard');
}

/** Delete a custom (non-preset) area. Presets are protected from deletion. */
export async function deleteArea(areaId: string) {
  const userId = await requireUser();
  const sb = getSupabase();

  // Block deletion of preset areas
  const { data: area, error: fetchErr } = await sb
    .from('progress_areas')
    .select('preset_key')
    .eq('id', areaId)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!area) throw new Error('Area not found');
  if ((area as { preset_key: string | null }).preset_key) {
    throw new Error('Preset areas cannot be deleted');
  }

  const { error } = await sb
    .from('progress_areas')
    .delete()
    .eq('id', areaId)
    .eq('clerk_user_id', userId);
  if (error) throw error;

  revalidatePath('/dashboard/progress');
  revalidatePath('/dashboard');
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
