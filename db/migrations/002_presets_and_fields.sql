-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: presets, extra area fields, and reflection notes on entries.
--
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- Areas now know whether they are a preset (auto-created, not deletable),
-- carry the user's personal "why this matters", and have an aspirational
-- target score.
alter table progress_areas
  add column if not exists preset_key     text,
  add column if not exists why_it_matters text default '',
  add column if not exists target_score   int check (target_score between 1 and 10);

-- Each user can have at most one of each preset_key. If preset_key is null
-- (i.e., a user-created custom area), the constraint does not apply.
create unique index if not exists progress_areas_preset_unique
  on progress_areas (clerk_user_id, preset_key)
  where preset_key is not null;

-- Entries can now carry a short reflection note explaining the score.
alter table progress_entries
  add column if not exists note text default '';
