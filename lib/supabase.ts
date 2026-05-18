import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client. Uses the service-role key, which bypasses
 * Row Level Security. This is fine because we never expose this client to
 * the browser — every call goes through a Next.js server action or route
 * handler that has already authenticated the request with Clerk.
 *
 * Required environment variables (set in Netlify → Environment variables):
 *   NEXT_PUBLIC_SUPABASE_URL       Your project URL (https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY      The service_role secret (NOT the anon key)
 */

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/* ============================================================
   TypeScript types matching db/schema.sql.
   ============================================================ */

export interface ProgressArea {
  id: string;
  clerk_user_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ProgressEntry {
  id: string;
  area_id: string;
  score: number;
  logged_at: string;
}

export interface MemberNote {
  id: string;
  clerk_user_id: string;
  author: string;
  body: string;
  created_at: string;
}
