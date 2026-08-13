'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase } from '@/lib/supabase';
import { stageRank, STAGE_ORDER, type JourneyStage } from '@/lib/dashboard/journey';

/**
 * Mutations for the quiet state behind the adaptive dashboard. Every action
 * authenticates with Clerk and scopes to the signed-in user.
 */

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

/** Mark the one-time welcome screen as seen so it never shows again. */
export async function markWelcomeSeen(): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();
  const { error } = await sb
    .from('dashboard_prefs')
    .upsert(
      { clerk_user_id: userId, welcome_seen: true, updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' },
    );
  // supabase-js returns errors rather than throwing. Unchecked, a failed write
  // here means the one-time welcome greets the member again on every visit.
  if (error) console.error('markWelcomeSeen failed', { code: error.code });
  revalidatePath('/dashboard');
}

/** Turn the always-available "show me everything" preference on or off. */
export async function setRevealAll(value: boolean): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();
  const { error } = await sb
    .from('dashboard_prefs')
    .upsert(
      { clerk_user_id: userId, reveal_all: Boolean(value), updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' },
    );
  if (error) console.error('setRevealAll failed', { code: error.code });
  revalidatePath('/dashboard', 'layout');
}

/**
 * Record that the member has seen the gentle "crossing" moment for a stage, so
 * it shows only once. Advance-only: we never move the seen stage backward.
 */
export async function markStageSeen(stage: JourneyStage): Promise<void> {
  if (!STAGE_ORDER.includes(stage)) return;
  const userId = await requireUser();
  const sb = getSupabase();

  const current = await sb
    .from('dashboard_prefs')
    .select('journey_seen_stage')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  const seen = (current.data?.journey_seen_stage as JourneyStage | undefined) ?? 'seed';
  if (stageRank(stage) <= stageRank(seen)) return; // already at or past this stage

  const { error } = await sb
    .from('dashboard_prefs')
    .update({ journey_seen_stage: stage, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId);
  // Unchecked, a failure replays the stage-crossing celebration every load.
  if (error) console.error('markStageSeen failed', { code: error.code });
  revalidatePath('/dashboard', 'layout');
}
