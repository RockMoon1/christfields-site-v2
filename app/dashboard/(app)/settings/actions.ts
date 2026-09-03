'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase } from '@/lib/supabase';
import { isValidTimeZone } from '@/lib/dashboard/timezone';
import { ensureMemberPrefs, ensureFeedToken, appUrl } from '@/lib/dashboard/prefs';

/**
 * The You screen and the flags behind Home's one slot card. Deliberately tiny:
 * one email toggle, a feed link, and "I saw that card" markers.
 */

export interface YouData {
  emailReminders: boolean;
  feedUrl: string | null;
  hasAvailability: boolean;
}

export async function getYou(): Promise<YouData> {
  const empty: YouData = { emailReminders: true, feedUrl: null, hasAvailability: false };
  try {
    const { userId } = await auth();
    if (!userId) return empty;
    const sb = getSupabase();
    const [prefs, token, weekly] = await Promise.all([
      ensureMemberPrefs(userId),
      ensureFeedToken(userId),
      sb.from('availability_weekly').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId),
    ]);
    return {
      emailReminders: prefs.email_reminders,
      feedUrl: token ? `${appUrl()}/api/ics/feed/${token}` : null,
      hasAvailability: (weekly.count ?? 0) > 0,
    };
  } catch (err) {
    console.error('getYou failed', err);
    return empty;
  }
}

/** Called by TimeZoneSync whenever the browser's zone is new or changed. */
export async function syncMemberTimeZone(tz: string): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId || !isValidTimeZone(tz)) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb
      .from('member_prefs')
      .upsert({ clerk_user_id: userId, tz, updated_at: new Date().toISOString() }, { onConflict: 'clerk_user_id' });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function setEmailReminders(on: boolean): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    await ensureMemberPrefs(userId);
    const sb = getSupabase();
    const { error } = await sb
      .from('member_prefs')
      .update({ email_reminders: !!on, updated_at: new Date().toISOString() })
      .eq('clerk_user_id', userId);
    revalidatePath('/dashboard/settings');
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

const CARD_FLAGS = {
  hello: 'hello_seen',
  install: 'install_nudge_seen',
  push: 'push_primer_seen',
  free: 'free_nudge_seen',
} as const;

export type HomeCardKind = keyof typeof CARD_FLAGS;

/** One tap dismisses a Home slot card for good. */
export async function dismissHomeCard(kind: HomeCardKind): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    const column = CARD_FLAGS[kind];
    if (!userId || !column) return { ok: false };
    await ensureMemberPrefs(userId);
    const sb = getSupabase();
    const { error } = await sb
      .from('member_prefs')
      .update({ [column]: true, updated_at: new Date().toISOString() })
      .eq('clerk_user_id', userId);
    revalidatePath('/dashboard');
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
