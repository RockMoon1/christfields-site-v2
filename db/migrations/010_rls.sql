-- 010_rls.sql
-- Defense-in-depth: enable Row Level Security on every member-data table.
--
-- IMPORTANT: the app currently reads/writes with the Supabase SERVICE-ROLE key,
-- which has BYPASSRLS. So turning RLS on here changes NOTHING for the running
-- app today. What it buys: the database becomes deny-by-default for any future
-- anon/authenticated (non-service-role) access path. If a future query ever
-- runs under the anon key, or the anon key leaks, no member row can be read
-- without an explicit policy. It turns "we must never forget a clerk_user_id
-- filter" into "the database refuses to leak unless we say otherwise."
--
-- No policies are created here on purpose => default deny for non-bypass roles.
--
-- PHASE B (later, bigger): move reads to a Clerk-JWT authenticated Supabase
-- client and add per-row policies like:
--   create policy "own rows" on prayer_requests for all
--     using (clerk_user_id = auth.jwt() ->> 'sub');
-- so RLS actively ENFORCES tenant isolation instead of only documenting it.
-- Do that as a deliberate migration with browser testing, not in this file.

alter table progress_areas          enable row level security;
alter table progress_entries        enable row level security;
alter table member_notes            enable row level security;
alter table area_journal            enable row level security;
alter table practices               enable row level security;
alter table practice_logs           enable row level security;
alter table prayer_requests         enable row level security;
alter table gratitude_entries       enable row level security;
alter table mood_checkins           enable row level security;
alter table reflections             enable row level security;
alter table thought_records         enable row level security;
alter table memory_verses           enable row level security;
alter table community_prayers       enable row level security;
alter table community_intercessions enable row level security;
alter table dashboard_prefs         enable row level security;
alter table group_attendance        enable row level security;
alter table events                  enable row level security;
alter table event_rsvps             enable row level security;
alter table availability_weekly     enable row level security;
alter table availability_overrides  enable row level security;
alter table calendar_feeds          enable row level security;
alter table calendar_busy           enable row level security;
alter table ai_verse_usage          enable row level security;
