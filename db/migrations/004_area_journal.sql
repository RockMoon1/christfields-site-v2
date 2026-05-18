-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: area_journal table for free-form reflections per area.
--
-- Different from progress_entries.note (which is the quick line attached to
-- a specific 1-10 score). Journal entries are standalone reflections about
-- the area: what the user has tried, what is working, what is not, who they
-- are helping. The Resources page prompts them differently based on tier.
--
-- Run in Supabase → SQL Editor → New query → paste → Run.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists area_journal (
  id            uuid primary key default gen_random_uuid(),
  area_id       uuid not null references progress_areas(id) on delete cascade,
  clerk_user_id text not null,
  body          text not null,
  created_at    timestamptz not null default now()
);

create index if not exists area_journal_user_area_idx
  on area_journal (clerk_user_id, area_id, created_at desc);
