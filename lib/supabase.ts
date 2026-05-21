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
  preset_key: string | null;
  why_it_matters: string;
  target_score: number | null;
  color: string;
  created_at: string;
}

export interface ProgressEntry {
  id: string;
  area_id: string;
  score: number;
  note: string;
  logged_at: string;
}

export interface MemberNote {
  id: string;
  clerk_user_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface AreaJournal {
  id: string;
  area_id: string;
  clerk_user_id: string;
  body: string;
  created_at: string;
}

/* ============================================================
   Dashboard v2 — matches db/dashboard-v2.sql.
   ============================================================ */

export type Cadence = 'daily' | 'weekly';

export interface Practice {
  id: string;
  clerk_user_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  cadence: Cadence;
  target_per_week: number;
  scripture: string;
  anchor: string;
  preset_key: string | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface PracticeLog {
  id: string;
  practice_id: string;
  clerk_user_id: string;
  done_on: string; // YYYY-MM-DD
  note: string;
  created_at: string;
}

export type PrayerStatus = 'open' | 'answered';

export interface PrayerRequest {
  id: string;
  clerk_user_id: string;
  title: string;
  body: string;
  category: string;
  status: PrayerStatus;
  answered_note: string;
  answered_at: string | null;
  shared: boolean;
  created_at: string;
}

export interface GratitudeEntry {
  id: string;
  clerk_user_id: string;
  entry_date: string; // YYYY-MM-DD
  item_one: string;
  item_two: string;
  item_three: string;
  created_at: string;
}

export interface MoodCheckin {
  id: string;
  clerk_user_id: string;
  mood: number; // 1-5
  label: string;
  note: string;
  checked_at: string;
}

export interface Reflection {
  id: string;
  clerk_user_id: string;
  entry_date: string; // YYYY-MM-DD
  consolation: string;
  desolation: string;
  intention: string;
  created_at: string;
}

export interface ThoughtRecord {
  id: string;
  clerk_user_id: string;
  entry_date: string; // YYYY-MM-DD
  situation: string;
  thought: string;
  reframe: string;
  scripture_ref: string;
  created_at: string;
}

export type MemoryStatus = 'learning' | 'memorized';

export interface MemoryVerse {
  id: string;
  clerk_user_id: string;
  reference: string;
  verse_text: string;
  translation: string;
  status: MemoryStatus;
  reviews: number;
  last_reviewed: string | null;
  created_at: string;
}

export interface CommunityPrayer {
  id: string;
  clerk_user_id: string;
  author_name: string;
  title: string;
  body: string;
  pray_count: number;
  answered: boolean;
  created_at: string;
}

export interface CommunityIntercession {
  id: string;
  community_prayer_id: string;
  clerk_user_id: string;
  created_at: string;
}
