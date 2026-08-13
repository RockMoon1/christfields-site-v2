'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  getSupabase,
  type MoodCheckin,
  type GratitudeEntry,
  type Reflection,
  type ThoughtRecord,
} from '@/lib/supabase';
import { dayKeyInZone, zonedDayRangeUTC } from '@/lib/dashboard/timezone';
import { getMemberTimeZone } from '@/lib/dashboard/timezone-server';

/**
 * Server actions for the Reflect feature.
 *
 * Every action authenticates with Clerk first. All queries are scoped by
 * clerk_user_id. Reads try/catch and return safe defaults so the page
 * renders even when tables do not exist yet.
 */

async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not signed in');
  return userId;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/* ============================================================
   Read: load everything needed for today's Reflect page.
   ============================================================ */

export interface TodayReflect {
  mood: MoodCheckin | null;
  gratitude: GratitudeEntry | null;
  examen: Reflection | null;
  recentMoods: { date: string; mood: number }[];
}

export async function getTodayReflect(): Promise<TodayReflect> {
  const safe: TodayReflect = { mood: null, gratitude: null, examen: null, recentMoods: [] };
  try {
    const { userId } = await auth();
    if (!userId) return safe;

    const sb = getSupabase();
    const tz = await getMemberTimeZone();
    const today = dayKeyInZone(tz);

    // Most recent mood check-in from the member's own day. checked_at is an
    // instant, so the window is the real start and end of their local day.
    const { start, end } = zonedDayRangeUTC(tz, today);
    const { data: moodRow } = await sb
      .from('mood_checkins')
      .select('*')
      .eq('clerk_user_id', userId)
      .gte('checked_at', start)
      .lt('checked_at', end)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Today's gratitude entry.
    const { data: gratitudeRow } = await sb
      .from('gratitude_entries')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('entry_date', today)
      .maybeSingle();

    // Today's examen reflection.
    const { data: examenRow } = await sb
      .from('reflections')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('entry_date', today)
      .maybeSingle();

    // Last 30 mood check-ins for the sparkline.
    const { data: moodHistory } = await sb
      .from('mood_checkins')
      .select('checked_at, mood')
      .eq('clerk_user_id', userId)
      .order('checked_at', { ascending: false })
      .limit(30);

    // Label each point with the member's own day, not the UTC one, so an
    // evening check-in is not plotted as the following day.
    const recentMoods = ((moodHistory as Pick<MoodCheckin, 'checked_at' | 'mood'>[] | null) ?? [])
      .map((r) => ({ date: dayKeyInZone(tz, new Date(r.checked_at)), mood: r.mood }))
      .reverse();

    return {
      mood: (moodRow as MoodCheckin | null) ?? null,
      gratitude: (gratitudeRow as GratitudeEntry | null) ?? null,
      examen: (examenRow as Reflection | null) ?? null,
      recentMoods,
    };
  } catch (err) {
    console.error('getTodayReflect: unexpected failure', err);
    return safe;
  }
}

/* ============================================================
   Save: mood check-in.
   ============================================================ */

export async function saveMood(input: {
  mood: number;
  label: string;
  note: string;
}): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();

  const { error } = await sb.from('mood_checkins').insert({
    clerk_user_id: userId,
    mood: clamp(input.mood, 1, 5),
    label: input.label.trim().slice(0, 60),
    note: input.note.trim().slice(0, 500),
  });
  if (error) throw error;

  revalidatePath('/dashboard/reflect');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/today');
}

/* ============================================================
   Save: gratitude entry (upsert by user + date).
   ============================================================ */

export async function saveGratitude(input: {
  itemOne: string;
  itemTwo: string;
  itemThree: string;
}): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();
  const tz = await getMemberTimeZone();
  const today = dayKeyInZone(tz);

  const itemOne = input.itemOne.trim().slice(0, 300);
  const itemTwo = input.itemTwo.trim().slice(0, 300);
  const itemThree = input.itemThree.trim().slice(0, 300);

  if (!itemOne && !itemTwo && !itemThree) return;

  // Check for existing row.
  const { data: existing } = await sb
    .from('gratitude_entries')
    .select('id')
    .eq('clerk_user_id', userId)
    .eq('entry_date', today)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from('gratitude_entries')
      .update({ item_one: itemOne, item_two: itemTwo, item_three: itemThree })
      .eq('id', (existing as { id: string }).id)
      .eq('clerk_user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await sb.from('gratitude_entries').insert({
      clerk_user_id: userId,
      entry_date: today,
      item_one: itemOne,
      item_two: itemTwo,
      item_three: itemThree,
    });
    if (error) throw error;
  }

  revalidatePath('/dashboard/reflect');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/today');
}

/* ============================================================
   Save: Ignatian Examen reflection (upsert by user + date).
   ============================================================ */

export async function saveExamen(input: {
  consolation: string;
  desolation: string;
  intention: string;
}): Promise<void> {
  const userId = await requireUser();
  const sb = getSupabase();
  const tz = await getMemberTimeZone();
  const today = dayKeyInZone(tz);

  // All three fields share the textarea's 1000-character limit. A lower cap
  // here silently ate the end of a member's own words.
  const consolation = input.consolation.trim().slice(0, 1000);
  const desolation = input.desolation.trim().slice(0, 1000);
  const intention = input.intention.trim().slice(0, 1000);

  // Check for existing row.
  const { data: existing } = await sb
    .from('reflections')
    .select('id')
    .eq('clerk_user_id', userId)
    .eq('entry_date', today)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from('reflections')
      .update({ consolation, desolation, intention })
      .eq('id', (existing as { id: string }).id)
      .eq('clerk_user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await sb.from('reflections').insert({
      clerk_user_id: userId,
      entry_date: today,
      consolation,
      desolation,
      intention,
    });
    if (error) throw error;
  }

  revalidatePath('/dashboard/reflect');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/today');
}

/* ============================================================
   Save: CBT thought record.
   ============================================================ */

export async function saveThoughtRecord(input: {
  situation: string;
  thought: string;
  reframe: string;
  scriptureRef: string;
}): Promise<void> {
  const userId = await requireUser();
  if (!input.thought.trim()) throw new Error('Thought is required');

  const sb = getSupabase();
  const tz = await getMemberTimeZone();
  const today = dayKeyInZone(tz);

  const { error } = await sb.from('thought_records').insert({
    clerk_user_id: userId,
    entry_date: today,
    situation: input.situation.trim().slice(0, 500),
    thought: input.thought.trim().slice(0, 500),
    reframe: input.reframe.trim().slice(0, 1000),
    scripture_ref: input.scriptureRef.trim().slice(0, 120),
  });
  if (error) throw error;

  revalidatePath('/dashboard/reflect');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/today');
}

/* ============================================================
   Read: recent thought records, newest first.
   ============================================================ */

export async function getThoughtRecords(): Promise<ThoughtRecord[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const sb = getSupabase();
    const { data } = await sb
      .from('thought_records')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return (data as ThoughtRecord[] | null) ?? [];
  } catch (err) {
    console.error('getThoughtRecords: unexpected failure', err);
    return [];
  }
}
