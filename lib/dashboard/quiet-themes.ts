import { getSupabase } from '@/lib/supabase';
import { themeInfo, type ThemeInfo } from './themes';

/**
 * What a leader may learn from the group's quiet reflections: theme words
 * only, no names, no counts, and only once enough people have written that
 * a word cannot point at a person. Safety entries never appear here.
 */

const WINDOW_DAYS = 14;
export const MIN_SHARERS = 3;
const MAX_THEMES = 3;

export async function groupThemes(memberIds: string[], nowMs: number = Date.now()): Promise<ThemeInfo[]> {
  if (memberIds.length === 0) return [];
  const sb = getSupabase();
  const since = new Date(nowMs - WINDOW_DAYS * 86_400_000).toISOString();
  const [rowsRes, prefsRes] = await Promise.all([
    sb
      .from('quiet_reflections')
      .select('clerk_user_id, themes')
      .in('clerk_user_id', memberIds)
      .eq('safety', false)
      .gte('created_at', since)
      .limit(500),
    sb.from('member_prefs').select('clerk_user_id, share_themes').in('clerk_user_id', memberIds),
  ]);
  const optedOut = new Set(
    ((prefsRes.data as { clerk_user_id: string; share_themes: boolean }[] | null) ?? [])
      .filter((p) => p.share_themes === false)
      .map((p) => p.clerk_user_id),
  );
  const people = new Set<string>();
  const counts = new Map<string, number>();
  for (const r of (rowsRes.data as { clerk_user_id: string; themes: string[] }[] | null) ?? []) {
    if (optedOut.has(r.clerk_user_id) || !r.themes?.length) continue;
    people.add(r.clerk_user_id);
    for (const t of r.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  if (people.size < MIN_SHARERS) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_THEMES)
    .map(([key]) => themeInfo(key))
    .filter((t): t is ThemeInfo => !!t);
}
