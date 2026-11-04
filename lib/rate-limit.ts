import { getSupabase } from '@/lib/supabase';

/**
 * Durable, atomic fixed-window rate limiting backed by Supabase.
 *
 * The in-memory limiters in the API routes reset per serverless instance and
 * are bypassable across cold starts. This gives those routes a shared, atomic
 * counter instead.
 *
 * Fail closed when the backing counter is unavailable. Callers may report a
 * temporary service error; serverless memory is not a shared abuse boundary.
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
    if (error || typeof data !== 'number') return { allowed: false, durable: false };
    return { allowed: data <= limit, durable: true };
  } catch {
    return { allowed: false, durable: false };
  }
}
