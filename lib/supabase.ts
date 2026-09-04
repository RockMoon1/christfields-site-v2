import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client. Uses the service-role key, which bypasses
 * Row Level Security. This is fine because we never expose this client to
 * the browser — every call goes through a Next.js server action or route
 * handler that has already authenticated the request with Clerk and checked
 * group membership through lib/groups/membership.ts.
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
   Schedule — matches db/migrations/005_events.sql + 018_schedule_manager.sql
   ============================================================ */

export type EventStatus = 'scheduled' | 'cancelled';
export type EventRsvpStatus = 'going' | 'maybe' | 'not_going';

export interface EventRow {
  id: string;
  org_id: string;
  created_by: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  status: EventStatus;
  cancelled_at: string | null;
  cancel_reason: string;
  updated_at: string;
  version: number;
  tz: string;
  series_id: string | null;
  member_note: string;
  leader_note: string;
  thanks_note: string;
  rides_enabled: boolean;
  host_user_id: string | null;
  /** Phase 4 (migration 020): optional Scripture for the gathering. */
  scripture_ref: string;
  scripture_text: string;
  scripture_why: string;
  /** Up to three questions for the group, newline separated. Member-visible. */
  discussion: string;
  /** Historical / interpretive notes. LEADER-ONLY. */
  context_notes: string;
}

export interface EventRsvpRow {
  id: string;
  event_id: string;
  clerk_user_id: string;
  status: EventRsvpStatus;
  updated_at: string;
  plan: string;
  display_name: string;
  image_url: string;
  first_time: boolean;
}

export interface EventAttendanceRow {
  event_id: string;
  clerk_user_id: string;
  present: boolean;
  marked_by: string;
  marked_at: string;
}

export interface OrgMemberSeenRow {
  org_id: string;
  clerk_user_id: string;
  first_seen_at: string;
}

export type SlotKind = 'bring' | 'ride';

export interface EventSlotRow {
  id: string;
  event_id: string;
  kind: SlotKind;
  label: string;
  capacity: number;
  created_by: string;
  created_at: string;
}

export interface EventSlotClaimRow {
  slot_id: string;
  clerk_user_id: string;
  display_name: string;
  qty: number;
  created_at: string;
}

export type ChangeKind = 'created' | 'changed' | 'cancelled' | 'thanks';

export interface EventChangeRow {
  id: string;
  org_id: string;
  event_id: string;
  kind: ChangeKind;
  summary: string;
  created_by: string;
  created_at: string;
}

export interface NotificationDeliveryRow {
  id: string;
  dedupe_key: string;
  clerk_user_id: string;
  channel: 'push' | 'email' | 'broadcast';
  status: 'pending' | 'sent' | 'failed' | 'skipped_budget' | 'skipped_quiet';
  provider_id: string | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  clerk_user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
  created_at: string;
  last_ok_at: string | null;
  fail_count: number;
}

export interface MemberPrefsRow {
  clerk_user_id: string;
  tz: string;
  email_reminders: boolean;
  hello_seen: boolean;
  install_nudge_seen: boolean;
  push_primer_seen: boolean;
  free_nudge_seen: boolean;
  feed_token: string | null;
  updated_at: string;
  /** Phase 4 (migration 020). */
  share_themes: boolean;
  rhythm_nudged_at: string | null;
}

export interface QuietReflectionRow {
  id: string;
  clerk_user_id: string;
  question_key: string;
  body_enc: string;
  themes: string[];
  confirmed: boolean;
  safety: boolean;
  created_at: string;
}

/* ============================================================
   Availability — usual weekly pattern + specific-date overrides.
   Matches db/migrations/007_availability.sql.
   ============================================================ */

export interface AvailabilityWeeklyRow {
  id: string;
  clerk_user_id: string;
  weekday: number; // 0=Sun..6=Sat
  slot: 'morning' | 'afternoon' | 'evening';
  created_at: string;
}

export interface AvailabilityOverrideRow {
  id: string;
  clerk_user_id: string;
  on_date: string; // YYYY-MM-DD
  slot: 'morning' | 'afternoon' | 'evening';
  available: boolean;
  created_at: string;
}

/* ============================================================
   Calendar feed connect. Matches 008_calendar_feeds.sql + 018.
   ============================================================ */

export type CalendarFeedStatus = 'pending' | 'ok' | 'error';

export interface CalendarFeedRow {
  clerk_user_id: string;
  ics_url: string;
  ics_url_enc: string | null;
  tz: string;
  status: CalendarFeedStatus;
  last_error: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BusySource = 'ics' | 'google';

export interface CalendarBusyRow {
  id: string;
  clerk_user_id: string;
  on_date: string; // YYYY-MM-DD
  slot: 'morning' | 'afternoon' | 'evening';
  source: BusySource;
  created_at: string;
}

/* ============================================================
   Google Calendar (Phase 3). Matches 018.
   ============================================================ */

export interface GoogleConnectionRow {
  clerk_user_id: string;
  google_sub: string | null;
  refresh_token_enc: string;
  scopes: string[];
  cf_calendar_id: string | null;
  status: 'ok' | 'revoked' | 'error';
  last_error: string | null;
  last_freebusy_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarPushRow {
  event_id: string;
  clerk_user_id: string;
  google_event_id: string;
  event_version: number;
  pushed_at: string;
}

/* ============================================================
   Community: the shared prayer wall (kept). Matches db/dashboard-v2.sql.
   ============================================================ */

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
