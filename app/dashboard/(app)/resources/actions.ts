'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type AreaJournal } from '@/lib/supabase';

/**
 * Server actions for the per-area journal on the Resources page.
 *
 * Every action authenticates with Clerk first and checks that the target
 * area belongs to the signed-in user before reading or writing.
 */

export interface JournalEntry {
  id: string;
  body: string;
  createdAt: string;
}

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

async function assertOwnsArea(areaId: string, userId: string): Promise<void> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('progress_areas')
    .select('id')
    .eq('id', areaId)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Area not found');
}

/** Load the journal entries for a single area, newest first. */
export async function getJournal(areaId: string): Promise<JournalEntry[]> {
  try {
    const userId = await requireUser();
    await assertOwnsArea(areaId, userId);
    const sb = getSupabase();

    const { data, error } = await sb
      .from('area_journal')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('area_id', areaId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return ((data as AreaJournal[]) || []).map((j) => ({
      id: j.id,
      body: j.body,
      createdAt: j.created_at,
    }));
  } catch (err) {
    console.error('getJournal failed', err);
    return [];
  }
}

/** Add a new journal entry. Returns the saved row. */
export async function addJournalEntry(
  areaId: string,
  body: string,
): Promise<JournalEntry> {
  const userId = await requireUser();
  const text = body.trim();
  if (!text) throw new Error('Reflection cannot be empty');
  if (text.length > 4000) throw new Error('Reflection too long');
  await assertOwnsArea(areaId, userId);

  const sb = getSupabase();
  const { data, error } = await sb
    .from('area_journal')
    .insert({
      area_id: areaId,
      clerk_user_id: userId,
      body: text,
    })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Insert returned no row');

  revalidatePath('/dashboard/resources');

  const j = data as AreaJournal;
  return { id: j.id, body: j.body, createdAt: j.created_at };
}

/** Delete a journal entry. Verifies ownership via clerk_user_id. */
export async function deleteJournalEntry(id: string): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();

  const { error } = await sb
    .from('area_journal')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);
  if (error) throw error;

  revalidatePath('/dashboard/resources');
}
