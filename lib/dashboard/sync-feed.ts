import 'server-only';
import { getSupabase } from '@/lib/supabase';
import { fetchBusySlots } from '@/lib/dashboard/ics';
const DAY = 86_400_000;
const SYNC_DAYS = 28;
function startOfTodayUtcMs() { const now = new Date(); return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()); }

export async function syncFeedForUser(
  userId: string,
  url: string,
  tz: string,
  timeoutMs: number = 8000,
): Promise<{ ok: boolean; error?: string }> {
  const fromMs = startOfTodayUtcMs();
  const toMs = fromMs + SYNC_DAYS * DAY;
  const result = await fetchBusySlots(url, tz, fromMs, toMs, timeoutMs);

  const sb = getSupabase();
  if (result.ok) {
    await sb.from('calendar_busy').delete().eq('clerk_user_id', userId).eq('source', 'ics');
    if (result.slots.length > 0) {
      const { error } = await sb
        .from('calendar_busy')
        .insert(result.slots.map((s) => ({ clerk_user_id: userId, on_date: s.date, slot: s.slot, source: 'ics' })));
      if (error) console.error('syncFeed: busy insert failed', { code: error.code });
    }
  }

  await sb
    .from('calendar_feeds')
    .update({
      status: result.ok ? 'ok' : 'error',
      last_error: result.error ?? null,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tz,
    })
    .eq('clerk_user_id', userId);

  return { ok: result.ok, error: result.error };
}
