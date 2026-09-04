import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationDeliveryRow } from '@/lib/supabase';

/**
 * The dedupe ledger. One row per (thing, member, channel). A sender first
 * CLAIMS rows as `pending` (insert, on conflict do nothing); whatever comes
 * back is theirs to send, and anything already present belongs to another run
 * (a retried action, a second tick). Afterwards the row is marked sent,
 * failed, or skipped. The tick sweeps stale `pending` rows to `failed`.
 *
 * Tick-driven kinds claim only what they can send right now (budget, quiet
 * hours); everyone else is left unclaimed so the next hourly tick can try.
 */

export type Channel = 'push' | 'email';
export type DeliveryStatus = NotificationDeliveryRow['status'];

export async function claimMany(
  sb: SupabaseClient,
  dedupeKey: string,
  userIds: string[],
  channel: Channel,
): Promise<Set<string>> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return new Set();
  const { data, error } = await sb
    .from('notification_deliveries')
    .upsert(
      ids.map((id) => ({ dedupe_key: dedupeKey, clerk_user_id: id, channel, status: 'pending' })),
      { onConflict: 'dedupe_key,clerk_user_id,channel', ignoreDuplicates: true },
    )
    .select('clerk_user_id');
  if (error) {
    console.error('claimMany failed', error);
    return new Set();
  }
  return new Set(((data as { clerk_user_id: string }[] | null) ?? []).map((r) => r.clerk_user_id));
}

export async function markMany(
  sb: SupabaseClient,
  dedupeKey: string,
  userIds: string[],
  channel: Channel,
  status: DeliveryStatus,
): Promise<void> {
  if (userIds.length === 0) return;
  const { error } = await sb
    .from('notification_deliveries')
    .update({ status })
    .eq('dedupe_key', dedupeKey)
    .eq('channel', channel)
    .in('clerk_user_id', userIds);
  if (error) console.error('markMany failed', error);
}

export async function markOne(
  sb: SupabaseClient,
  dedupeKey: string,
  userId: string,
  channel: Channel,
  status: DeliveryStatus,
  providerId?: string,
): Promise<void> {
  const { error } = await sb
    .from('notification_deliveries')
    .update({ status, provider_id: providerId ?? null })
    .eq('dedupe_key', dedupeKey)
    .eq('channel', channel)
    .eq('clerk_user_id', userId);
  if (error) console.error('markOne failed', error);
}

/** Give claims back (a run that could not finish); the next run may take them. */
export async function releaseClaims(
  sb: SupabaseClient,
  dedupeKey: string,
  userIds: string[],
  channel: Channel,
): Promise<void> {
  if (userIds.length === 0) return;
  await sb
    .from('notification_deliveries')
    .delete()
    .eq('dedupe_key', dedupeKey)
    .eq('channel', channel)
    .eq('status', 'pending')
    .in('clerk_user_id', userIds);
}

/** True when any row exists for the key (used for once-per-event things like Nudge). */
export async function anyDelivery(sb: SupabaseClient, dedupeKey: string): Promise<boolean> {
  const { count } = await sb
    .from('notification_deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('dedupe_key', dedupeKey);
  return (count ?? 0) > 0;
}

/** Pushes actually SENT since `sinceIso`, per member, for the daily ceiling. */
export async function pushCountsSince(
  sb: SupabaseClient,
  userIds: string[],
  sinceIso: string,
  keyFilter: (key: string) => boolean,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (userIds.length === 0) return out;
  const { data } = await sb
    .from('notification_deliveries')
    .select('clerk_user_id, dedupe_key')
    .eq('channel', 'push')
    .eq('status', 'sent')
    .in('clerk_user_id', userIds)
    .gte('created_at', sinceIso)
    .limit(2000);
  for (const r of (data as { clerk_user_id: string; dedupe_key: string }[] | null) ?? []) {
    if (!keyFilter(r.dedupe_key)) continue;
    out.set(r.clerk_user_id, (out.get(r.clerk_user_id) ?? 0) + 1);
  }
  return out;
}
