-- ─────────────────────────────────────────────────────────────────────────────
-- 019_drop_teaching.sql
-- Removes the teaching-era tables. IRREVERSIBLE.
--
-- Founder decision, recorded 2026-09-02 (Lisandro Pellow, in the planning
-- session for the schedule-manager rewrite): "Drop it all." No export, no
-- backup wanted. Five of these tables hold members' free-text personal writing
-- (prayer_requests, gratitude_entries, reflections, thought_records,
-- area_journal). The prayer wall (community_prayers, community_intercessions)
-- is KEPT by the same decision.
--
-- HOW TO RUN
--   Only after 018 has run AND the rewrite has been live and checked for a week
--   AND `npm run check:tables` passes on main.
--   Supabase → SQL Editor → New query → paste this whole file → Run.
--   Safe to re-run (IF EXISTS everywhere).
-- ─────────────────────────────────────────────────────────────────────────────

-- Teaching and discipleship features.
drop table if exists practice_logs      cascade;
drop table if exists practices          cascade;
drop table if exists prayer_requests    cascade;
drop table if exists gratitude_entries  cascade;
drop table if exists mood_checkins      cascade;
drop table if exists reflections        cascade;
drop table if exists thought_records    cascade;
drop table if exists memory_verses      cascade;
drop table if exists area_journal       cascade;
drop table if exists progress_entries   cascade;
drop table if exists progress_areas     cascade;

-- Journey engine state and week-anchored attendance (replaced by
-- member_prefs and event_attendance; org_member_seen was seeded from
-- group_attendance in 018 before this drop).
drop table if exists dashboard_prefs    cascade;
drop table if exists group_attendance   cascade;

-- Already dead before the rewrite.
drop table if exists member_notes       cascade;
drop table if exists ai_verse_usage     cascade;

-- The pasted calendar link now lives encrypted in calendar_feeds.ics_url_enc.
-- Blank any plaintext that was migrated on read, then drop the old column.
update calendar_feeds set ics_url = '' where ics_url_enc is not null and ics_url <> '';
alter table calendar_feeds drop column if exists ics_url;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. db/schema.sql, db/dashboard-v2.sql, db/dashboard-v3.sql and migrations
-- 002, 003, 004, 006, 009, 010, 013 are now historical. Leave them in git.
-- ─────────────────────────────────────────────────────────────────────────────
