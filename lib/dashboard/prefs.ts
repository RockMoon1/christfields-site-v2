import { cache } from 'react';
import { randomBytes } from 'node:crypto';
import { getSupabase, type MemberPrefsRow } from '@/lib/supabase';

/**
 * The only per-member settings that exist, and the flags behind Home's one
 * "slot" card. Server-only helpers shared by actions and pages.
 *
 * No-row semantics (used by fan-out and the hourly tick too): email on, tz
 * unknown (fall back to the group's zone), nothing seen yet.
 */

export function prefsDefaults(userId: string): MemberPrefsRow {
  return {
    clerk_user_id: userId,
    tz: 'UTC',
    email_reminders: true,
    hello_seen: false,
    install_nudge_seen: false,
    push_primer_seen: false,
    free_nudge_seen: false,
    feed_token: null,
    updated_at: new Date(0).toISOString(),
    share_themes: true,
    rhythm_nudged_at: null,
  };
}

/** Create the row on first load; return it either way. Request-cached. */
export const ensureMemberPrefs = cache(async (userId: string): Promise<MemberPrefsRow> => {
  const sb = getSupabase();
  try {
    const existing = await sb.from('member_prefs').select('*').eq('clerk_user_id', userId).maybeSingle();
    if (existing.data) return existing.data as MemberPrefsRow;
    await sb.from('member_prefs').insert({ clerk_user_id: userId }).select().maybeSingle();
    const again = await sb.from('member_prefs').select('*').eq('clerk_user_id', userId).maybeSingle();
    return (again.data as MemberPrefsRow | null) ?? prefsDefaults(userId);
  } catch (err) {
    console.error('ensureMemberPrefs failed', err);
    return prefsDefaults(userId);
  }
});

/** The personal subscribe-feed token, minted on first ask. */
export async function ensureFeedToken(userId: string): Promise<string | null> {
  const sb = getSupabase();
  const prefs = await ensureMemberPrefs(userId);
  if (prefs.feed_token) return prefs.feed_token;
  const token = randomBytes(32).toString('base64url');
  const { error } = await sb
    .from('member_prefs')
    .update({ feed_token: token, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .is('feed_token', null);
  if (error) {
    console.error('ensureFeedToken failed', error);
    return null;
  }
  const again = await sb.from('member_prefs').select('feed_token').eq('clerk_user_id', userId).maybeSingle();
  return (again.data as { feed_token: string | null } | null)?.feed_token ?? token;
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://christfields2717.com').replace(/\/$/, '');
}
