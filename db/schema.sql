-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields database schema
--
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement uses IF NOT EXISTS.
--
-- All tables key off clerk_user_id (text), which is the Clerk user ID we get
-- from auth.userId() on the server. We do not duplicate user profile info
-- (name, email, photo) here — that lives in Clerk and we fetch it from there
-- when needed.
-- ─────────────────────────────────────────────────────────────────────────────

-- Areas the user is tracking. One row per (user, area).
create table if not exists progress_areas (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name          text not null,
  description   text default '',
  created_at    timestamptz not null default now()
);

create index if not exists progress_areas_user_idx
  on progress_areas (clerk_user_id, created_at desc);

-- Individual 1-10 score entries. Many rows per area.
create table if not exists progress_entries (
  id          uuid primary key default gen_random_uuid(),
  area_id     uuid not null references progress_areas(id) on delete cascade,
  score       int  not null check (score between 1 and 10),
  logged_at   timestamptz not null default now()
);

create index if not exists progress_entries_area_idx
  on progress_entries (area_id, logged_at);

-- RESERVED, NOT IN USE. Nothing in the app reads or writes this table: there is
-- no /dashboard/notes page and no admin view. Kept so an existing database is
-- not disturbed; drop it in a cleanup migration if it is still empty.
create table if not exists member_notes (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  author        text not null default 'Christ Fields',
  body          text not null,
  created_at    timestamptz not null default now()
);

create index if not exists member_notes_user_idx
  on member_notes (clerk_user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
--
-- RLS is ENABLED on every member-data table as a deny-by-default backstop —
-- see db/migrations/010_rls.sql (and 011_rate_limits.sql for rate_limit_counters).
-- With no policies, the anon/authenticated (public) roles can read nothing.
--
-- NOTE: the app reaches Supabase only with the service-role key, which has the
-- BYPASSRLS attribute — so RLS does not yet ENFORCE per-user isolation on the
-- app's own queries; the Clerk-scoped server actions do. Moving reads to a
-- Clerk-JWT client + per-row policies (so the database enforces tenant isolation
-- too) is "Phase B", to be done as a deliberate, tested migration. See 010_rls.sql.
-- ─────────────────────────────────────────────────────────────────────────────
