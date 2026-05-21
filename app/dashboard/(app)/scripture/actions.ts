'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type MemoryVerse, type MemoryStatus } from '@/lib/supabase';
import { verseForToday, type VerseOfDay } from '@/lib/dashboard/content';

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

export async function getScripture(): Promise<{
  verseOfDay: VerseOfDay;
  learning: MemoryVerse[];
  memorized: MemoryVerse[];
  dueCount: number;
}> {
  const safe = { verseOfDay: verseForToday(), learning: [], memorized: [], dueCount: 0 };

  try {
    const { userId } = await auth();
    if (!userId) return safe;

    const sb = getSupabase();
    const { data, error } = await sb
      .from('memory_verses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getScripture: failed to load memory_verses', error);
      return safe;
    }

    const rows = (data ?? []) as MemoryVerse[];
    const learning = rows.filter((r) => r.status === 'learning');
    const memorized = rows.filter((r) => r.status === 'memorized');

    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const dueCount = learning.filter((r) => {
      if (!r.last_reviewed) return true;
      return new Date(r.last_reviewed).getTime() < twoDaysAgo;
    }).length;

    return { verseOfDay: verseForToday(), learning, memorized, dueCount };
  } catch (err) {
    console.error('getScripture: unexpected failure', err);
    return safe;
  }
}

export async function addVerse(input: {
  reference: string;
  verseText: string;
  translation: string;
}): Promise<MemoryVerse> {
  const userId = await requireUser();

  const reference = input.reference.trim().slice(0, 100);
  const verse_text = input.verseText.trim().slice(0, 1000);
  const translation = input.translation.trim().slice(0, 20) || 'ESV';

  if (!reference) throw new Error('Reference is required');
  if (!verse_text) throw new Error('Verse text is required');

  const sb = getSupabase();
  const { data, error } = await sb
    .from('memory_verses')
    .insert({
      clerk_user_id: userId,
      reference,
      verse_text,
      translation,
      status: 'learning',
      reviews: 0,
      last_reviewed: null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Insert returned no row');

  revalidatePath('/dashboard/scripture');
  revalidatePath('/dashboard');

  return data as MemoryVerse;
}

export async function saveVerseOfDay(): Promise<MemoryVerse | null> {
  const userId = await requireUser();
  const verse = verseForToday();
  const sb = getSupabase();

  // Check if user already has a verse with this reference (case-insensitive)
  const { data: existing } = await sb
    .from('memory_verses')
    .select('id')
    .eq('clerk_user_id', userId)
    .ilike('reference', verse.reference)
    .maybeSingle();

  if (existing) return null;

  const { data, error } = await sb
    .from('memory_verses')
    .insert({
      clerk_user_id: userId,
      reference: verse.reference,
      verse_text: verse.verse_text,
      translation: verse.translation,
      status: 'learning',
      reviews: 0,
      last_reviewed: null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/dashboard/scripture');
  revalidatePath('/dashboard');

  return data as MemoryVerse;
}

export async function reviewVerse(id: string): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();

  // Ownership check + fetch current reviews count
  const { data: row, error: fetchErr } = await sb
    .from('memory_verses')
    .select('id, reviews')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error('Verse not found');

  const { error } = await sb
    .from('memory_verses')
    .update({
      reviews: (row as { id: string; reviews: number }).reviews + 1,
      last_reviewed: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/scripture');
  revalidatePath('/dashboard');
}

export async function setVerseStatus(id: string, status: MemoryStatus): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();

  // Ownership check
  const { data: row, error: fetchErr } = await sb
    .from('memory_verses')
    .select('id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error('Verse not found');

  const { error } = await sb
    .from('memory_verses')
    .update({ status })
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/scripture');
  revalidatePath('/dashboard');
}

export async function deleteVerse(id: string): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();

  // Ownership check
  const { data: row, error: fetchErr } = await sb
    .from('memory_verses')
    .select('id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) throw new Error('Verse not found');

  const { error } = await sb
    .from('memory_verses')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) throw error;

  revalidatePath('/dashboard/scripture');
  revalidatePath('/dashboard');
}
