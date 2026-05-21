-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields — Dashboard v2 schema (personal + community)
--
-- HOW TO RUN
--   Supabase  →  SQL Editor  →  New query  →  paste this whole file  →  Run.
--   Safe to re-run any time: every statement uses IF NOT EXISTS.
--
-- This file is ADDITIVE. It complements db/schema.sql (progress_areas,
-- progress_entries, member_notes, area_journal). Running it will NOT touch,
-- alter, or drop anything that already exists.
--
-- Every table keys off clerk_user_id (text) — the Clerk user ID we read on the
-- server via auth(). No RLS: all access goes through Clerk-authenticated
-- Next.js server actions that use the Supabase service-role key (server only,
-- never shipped to the browser).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Rhythms / Practices ("cards") ────────────────────────────────────────────
-- Repeatable spiritual + wellness practices a member commits to, e.g.
-- "Read Scripture", "Pray", "Sabbath rest". The "anchor" field stores a
-- habit-stacking cue ("After I pour my coffee...") which research shows makes
-- a new habit far more likely to stick. Each check-off lands in practice_logs,
-- which powers the forgiving weekly view and the gentle streak.
create table if not exists practices (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  name            text not null,
  description     text default '',
  icon            text not null default 'flame',
  color           text not null default '#c9a548',
  cadence         text not null default 'daily' check (cadence in ('daily','weekly')),
  target_per_week int  not null default 7 check (target_per_week between 1 and 7),
  scripture       text default '',
  anchor          text not null default '',
  preset_key      text,
  sort_order      int  not null default 0,
  archived        boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists practices_user_idx
  on practices (clerk_user_id, archived, sort_order, created_at);

create unique index if not exists practices_user_preset_idx
  on practices (clerk_user_id, preset_key) where preset_key is not null;

-- One check-off per practice per day.
create table if not exists practice_logs (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references practices(id) on delete cascade,
  clerk_user_id text not null,
  done_on       date not null default current_date,
  note          text default '',
  created_at    timestamptz not null default now(),
  unique (practice_id, done_on)
);

create index if not exists practice_logs_user_idx
  on practice_logs (clerk_user_id, done_on desc);
create index if not exists practice_logs_practice_idx
  on practice_logs (practice_id, done_on desc);


-- ── Prayer ────────────────────────────────────────────────────────────────────
-- Personal prayer list + journal. Requests start 'open' and can be marked
-- 'answered' with a short note, which becomes a record of faithfulness to
-- look back on.
create table if not exists prayer_requests (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  title         text not null,
  body          text default '',
  category      text not null default 'general',
  status        text not null default 'open' check (status in ('open','answered')),
  answered_note text default '',
  answered_at   timestamptz,
  shared        boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists prayer_requests_user_idx
  on prayer_requests (clerk_user_id, status, created_at desc);


-- ── Reflect: gratitude, mood, examen, thought records ─────────────────────────
-- Gratitude: up to three "good things" per day (the most evidence-backed
-- wellbeing practice — Emmons & McCullough, 2003).
create table if not exists gratitude_entries (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  entry_date    date not null default current_date,
  item_one      text not null default '',
  item_two      text default '',
  item_three    text default '',
  created_at    timestamptz not null default now()
);

create index if not exists gratitude_entries_user_idx
  on gratitude_entries (clerk_user_id, entry_date desc);

-- Mood: a 1-5 emotional check-in with an optional precise emotion word + note.
-- (Affect labeling — "name it to tame it" — down-regulates the amygdala.)
create table if not exists mood_checkins (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  mood          int  not null check (mood between 1 and 5),
  label         text default '',
  note          text default '',
  checked_at    timestamptz not null default now()
);

create index if not exists mood_checkins_user_idx
  on mood_checkins (clerk_user_id, checked_at desc);

-- Examen: a nightly reflection (Ignatian) — where you felt life (consolation),
-- where you felt drained (desolation), and an intention for tomorrow.
create table if not exists reflections (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  entry_date    date not null default current_date,
  consolation   text default '',
  desolation    text default '',
  intention     text default '',
  created_at    timestamptz not null default now()
);

create index if not exists reflections_user_idx
  on reflections (clerk_user_id, entry_date desc);

-- Thought record: a CBT-style reframe paired with Scripture
-- ("be transformed by the renewing of your mind", Rom 12:2).
create table if not exists thought_records (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  entry_date    date not null default current_date,
  situation     text default '',
  thought       text not null,
  reframe       text default '',
  scripture_ref text default '',
  created_at    timestamptz not null default now()
);

create index if not exists thought_records_user_idx
  on thought_records (clerk_user_id, created_at desc);


-- ── Scripture memory ──────────────────────────────────────────────────────────
create table if not exists memory_verses (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  reference     text not null,
  verse_text    text not null,
  translation   text not null default 'ESV',
  status        text not null default 'learning' check (status in ('learning','memorized')),
  reviews       int  not null default 0,
  last_reviewed timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists memory_verses_user_idx
  on memory_verses (clerk_user_id, status, created_at desc);


-- ── Community: shared prayer wall ─────────────────────────────────────────────
-- A lightweight, encouraging wall. Anyone signed in can post and can tap
-- "I prayed" once per request (recorded in community_intercessions, mirrored
-- onto pray_count for fast reads). No likes, no leaderboards.
create table if not exists community_prayers (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  author_name   text not null default 'A member',
  title         text not null,
  body          text default '',
  pray_count    int  not null default 0,
  answered      boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists community_prayers_idx
  on community_prayers (created_at desc);

-- One intercession ("I prayed for this") per member per prayer.
create table if not exists community_intercessions (
  id                  uuid primary key default gen_random_uuid(),
  community_prayer_id uuid not null references community_prayers(id) on delete cascade,
  clerk_user_id       text not null,
  created_at          timestamptz not null default now(),
  unique (community_prayer_id, clerk_user_id)
);

create index if not exists community_intercessions_idx
  on community_intercessions (clerk_user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Preset rhythms (Read Scripture, Pray, Sabbath, etc.) are seeded
-- automatically by the app on first load — no seed data needed here.
-- ─────────────────────────────────────────────────────────────────────────────
