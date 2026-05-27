'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type Practice, type PracticeLog, type Cadence } from '@/lib/supabase';
import { DEFAULT_COLOR, isValidAreaColor } from '@/lib/colors';
import {
  doneToday,
  currentStreak,
  weekCompletions,
  totalDays,
  lastNDays,
  todayUTC,
} from '@/lib/dashboard/streaks';

/**
 * Server actions for the Rhythms feature.
 *
 * Every action authenticates with Clerk first. The signed-in user's Clerk ID
 * scopes every query so no user can see or modify another user's data.
 * Reads wrap in try/catch and return safe defaults so the page renders even
 * before the owner runs the SQL migration.
 */

export interface RhythmWithStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  cadence: Cadence;
  targetPerWeek: number;
  scripture: string;
  anchor: string;
  presetKey: string | null;
  doneToday: boolean;
  currentStreak: number;
  weekDone: number;
  totalDays: number;
  last7: { date: string; done: boolean }[];
}

/* ============================================================
   Presets. Auto-created the first time the user opens Rhythms.
   Preset cards show a "Core" badge and cannot be archived from
   the UI (the archivePractice action checks and refuses).
   ============================================================ */

interface PresetDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  cadence: Cadence;
  targetPerWeek: number;
  scripture: string;
  anchor: string;
  sortOrder: number;
}

const PRESETS: PresetDef[] = [
  {
    key: 'read-scripture',
    name: 'Read Scripture',
    description: 'Time in the Word, even a few verses.',
    icon: 'book',
    color: '#e4c97a',
    cadence: 'daily',
    targetPerWeek: 7,
    scripture: 'Joshua 1:8',
    anchor: 'After my morning coffee, I will read a few verses.',
    sortOrder: 0,
  },
  {
    key: 'pray',
    name: 'Pray',
    description: 'Talk with God about today.',
    icon: 'pray',
    color: '#c9a548',
    cadence: 'daily',
    targetPerWeek: 7,
    scripture: 'Philippians 4:6',
    anchor: '',
    sortOrder: 1,
  },
  {
    key: 'gratitude',
    name: 'Gratitude',
    description: 'Name what you are thankful for.',
    icon: 'heart',
    color: '#52b788',
    cadence: 'daily',
    targetPerWeek: 7,
    scripture: '1 Thessalonians 5:18',
    anchor: '',
    sortOrder: 2,
  },
  {
    key: 'examen',
    name: 'Examen',
    description: 'Look back over the day with God.',
    icon: 'moon',
    color: '#7e6ba8',
    cadence: 'daily',
    targetPerWeek: 7,
    scripture: 'Psalm 139:23',
    anchor: 'Before bed, I will review the day.',
    sortOrder: 3,
  },
  {
    key: 'move',
    name: 'Move your body',
    description: 'A walk, a stretch, fresh air.',
    icon: 'sun',
    color: '#5b8db8',
    cadence: 'daily',
    targetPerWeek: 5,
    scripture: '',
    anchor: '',
    sortOrder: 4,
  },
  {
    key: 'reach-out',
    name: 'Reach out',
    description: 'Encourage one person.',
    icon: 'people',
    color: '#c47b3c',
    cadence: 'weekly',
    targetPerWeek: 3,
    scripture: '1 Thessalonians 5:11',
    anchor: '',
    sortOrder: 5,
  },
  {
    key: 'sabbath',
    name: 'Sabbath',
    description: 'Rest in Jesus. Not one day only, but every day.',
    icon: 'sabbath',
    color: '#a64453',
    cadence: 'daily',
    targetPerWeek: 7,
    scripture: 'Hebrews 4:9-10',
    anchor: 'When today gets heavy, I will stop and come to Jesus to rest.',
    sortOrder: 6,
  },
];

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

/**
 * Idempotent: ensures all preset practices exist for this user.
 * Fast-path: checks count first, only diffs and inserts if needed.
 */
async function ensurePractices(userId: string) {
  const sb = getSupabase();

  const { count } = await sb
    .from('practices')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .not('preset_key', 'is', null);

  if ((count ?? 0) >= PRESETS.length) return;

  const { data: existing } = await sb
    .from('practices')
    .select('preset_key')
    .eq('clerk_user_id', userId)
    .not('preset_key', 'is', null);

  const have = new Set(
    (existing as { preset_key: string }[] | null)?.map((r) => r.preset_key) || [],
  );
  const missing = PRESETS.filter((p) => !have.has(p.key));
  if (missing.length === 0) return;

  await sb.from('practices').insert(
    missing.map((p) => ({
      clerk_user_id: userId,
      preset_key: p.key,
      name: p.name,
      description: p.description,
      icon: p.icon,
      color: p.color,
      cadence: p.cadence,
      target_per_week: p.targetPerWeek,
      scripture: p.scripture,
      anchor: p.anchor,
      sort_order: p.sortOrder,
      archived: false,
    })),
  );
}

/**
 * Load all non-archived practices for the user with computed streaks.
 * Returns [] on any database failure so the page still renders.
 */
export async function getRhythms(): Promise<RhythmWithStatus[]> {
  try {
    const userId = await requireUser();
    await ensurePractices(userId);
    const sb = getSupabase();

    const { data: practices, error: practicesErr } = await sb
      .from('practices')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('archived', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (practicesErr) {
      console.error('getRhythms: failed to load practices', practicesErr);
      return [];
    }
    if (!practices || practices.length === 0) return [];

    const practiceIds = (practices as Practice[]).map((p) => p.id);

    const { data: logs, error: logsErr } = await sb
      .from('practice_logs')
      .select('*')
      .in('practice_id', practiceIds)
      .eq('clerk_user_id', userId);

    if (logsErr) {
      console.error('getRhythms: failed to load logs', logsErr);
    }

    const byPractice = new Map<string, string[]>();
    for (const log of (logs as PracticeLog[]) || []) {
      const dates = byPractice.get(log.practice_id) || [];
      dates.push(log.done_on);
      byPractice.set(log.practice_id, dates);
    }

    const last7Dates = lastNDays(7);

    return (practices as Practice[]).map((p) => {
      const dates = byPractice.get(p.id) || [];
      const doneSet = new Set(dates.map((d) => d.slice(0, 10)));
      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        icon: p.icon || 'flame',
        color: p.color || DEFAULT_COLOR,
        cadence: p.cadence,
        targetPerWeek: p.target_per_week,
        scripture: p.scripture || '',
        anchor: p.anchor || '',
        presetKey: p.preset_key,
        doneToday: doneToday(dates),
        currentStreak: currentStreak(dates),
        weekDone: weekCompletions(dates),
        totalDays: totalDays(dates),
        last7: last7Dates.map((date) => ({ date, done: doneSet.has(date) })),
      };
    });
  } catch (err) {
    console.error('getRhythms: unexpected failure', err);
    return [];
  }
}

/**
 * Toggle today's completion for a practice. Ownership-checked.
 * Returns the new doneToday state.
 */
export async function toggleToday(practiceId: string): Promise<{ doneToday: boolean }> {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: practice, error: ownerErr } = await sb
    .from('practices')
    .select('id')
    .eq('id', practiceId)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (ownerErr) throw ownerErr;
  if (!practice) throw new Error('Practice not found');

  const today = todayUTC();

  const { data: existing } = await sb
    .from('practice_logs')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('clerk_user_id', userId)
    .eq('done_on', today)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from('practice_logs')
      .delete()
      .eq('id', (existing as { id: string }).id)
      .eq('clerk_user_id', userId);
    if (error) throw error;

    revalidatePath('/dashboard/rhythms');
    revalidatePath('/dashboard');
    return { doneToday: false };
  } else {
    const { error } = await sb.from('practice_logs').insert({
      practice_id: practiceId,
      clerk_user_id: userId,
      done_on: today,
      note: '',
    });
    if (error) throw error;

    revalidatePath('/dashboard/rhythms');
    revalidatePath('/dashboard');
    return { doneToday: true };
  }
}

/** Add a new custom (non-preset) practice for the signed-in user. */
export async function createPractice(input: {
  name: string;
  description: string;
  icon: string;
  color: string;
  cadence: Cadence;
  targetPerWeek: number;
  scripture: string;
  anchor: string;
}): Promise<RhythmWithStatus> {
  const userId = await requireUser();
  if (!input.name.trim()) throw new Error('Practice name required');

  const validCadences: Cadence[] = ['daily', 'weekly'];
  if (!validCadences.includes(input.cadence)) throw new Error('Invalid cadence');

  const color = isValidAreaColor(input.color) ? input.color : DEFAULT_COLOR;
  const targetPerWeek = Math.max(1, Math.min(7, Math.round(input.targetPerWeek)));

  const sb = getSupabase();

  const { data: maxRow } = await sb
    .from('practices')
    .select('sort_order')
    .eq('clerk_user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = ((maxRow as { sort_order: number } | null)?.sort_order ?? -1) + 1;

  const { data, error } = await sb
    .from('practices')
    .insert({
      clerk_user_id: userId,
      preset_key: null,
      name: input.name.trim().slice(0, 100),
      description: input.description.trim().slice(0, 500),
      icon: input.icon.trim().slice(0, 50),
      color,
      cadence: input.cadence,
      target_per_week: targetPerWeek,
      scripture: input.scripture.trim().slice(0, 100),
      anchor: input.anchor.trim().slice(0, 280),
      sort_order: sortOrder,
      archived: false,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Insert returned no row');

  revalidatePath('/dashboard/rhythms');
  revalidatePath('/dashboard');

  const p = data as Practice;
  const last7Dates = lastNDays(7);
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    icon: p.icon || 'flame',
    color: p.color || DEFAULT_COLOR,
    cadence: p.cadence,
    targetPerWeek: p.target_per_week,
    scripture: p.scripture || '',
    anchor: p.anchor || '',
    presetKey: null,
    doneToday: false,
    currentStreak: 0,
    weekDone: 0,
    totalDays: 0,
    last7: last7Dates.map((date) => ({ date, done: false })),
  };
}

/** Update editable fields on an owned practice. */
export async function updatePractice(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    cadence: Cadence;
    targetPerWeek: number;
    scripture: string;
    anchor: string;
  }>,
) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: practice, error: ownerErr } = await sb
    .from('practices')
    .select('id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (ownerErr) throw ownerErr;
  if (!practice) throw new Error('Practice not found');

  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name.trim().slice(0, 100);
  if (patch.description !== undefined) updates.description = patch.description.trim().slice(0, 500);
  if (patch.icon !== undefined) updates.icon = patch.icon.trim().slice(0, 50);
  if (patch.color !== undefined) updates.color = isValidAreaColor(patch.color) ? patch.color : DEFAULT_COLOR;
  if (patch.cadence !== undefined) updates.cadence = patch.cadence;
  if (patch.targetPerWeek !== undefined) updates.target_per_week = Math.max(1, Math.min(7, Math.round(patch.targetPerWeek)));
  if (patch.scripture !== undefined) updates.scripture = patch.scripture.trim().slice(0, 100);
  if (patch.anchor !== undefined) updates.anchor = patch.anchor.trim().slice(0, 280);

  const { error } = await sb
    .from('practices')
    .update(updates)
    .eq('id', id)
    .eq('clerk_user_id', userId);
  if (error) throw error;

  revalidatePath('/dashboard/rhythms');
  revalidatePath('/dashboard');
}

/** Soft-archive a practice (custom only). Presets are protected. */
export async function archivePractice(id: string) {
  const userId = await requireUser();
  const sb = getSupabase();

  const { data: practice, error: fetchErr } = await sb
    .from('practices')
    .select('preset_key')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!practice) throw new Error('Practice not found');
  if ((practice as { preset_key: string | null }).preset_key) {
    throw new Error('Core rhythms cannot be removed');
  }

  const { error } = await sb
    .from('practices')
    .update({ archived: true })
    .eq('id', id)
    .eq('clerk_user_id', userId);
  if (error) throw error;

  revalidatePath('/dashboard/rhythms');
  revalidatePath('/dashboard');
}
