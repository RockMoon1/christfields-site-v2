import { getSupabase } from '@/lib/supabase';

/**
 * Durable, atomic fixed-window rate limiting backed by Supabase.
 *
 * The in-memory limiters in the API routes reset per serverless instance and
 * are bypassable across cold starts. This gives those routes a shared, atomic
 * counter instead.
 *
 * Graceful by design: if the backing function/table is not present yet
 * (migration 011 not run), this returns `{ durable: false }` and the caller
 * falls back to its in-memory limiter, so behavior never regresses. Once the
 * migration is applied, the same code starts enforcing a real global limit with
 * no further changes.
 */
export async function takeRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; durable: boolean }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.rpc('rate_limit_take', {
      p_bucket: bucket,
      p_window_seconds: windowSeconds,
    });
    if (error || typeof data !== 'number') return { allowed: true, durable: false };
    return { allowed: data <= limit, durable: true };
  } catch {
    return { allowed: true, durable: false };
  }
}
