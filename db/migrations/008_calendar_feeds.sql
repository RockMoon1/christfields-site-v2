-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields — Calendar feed connect (auto-fill busy times from a private .ics)
--
-- HOW TO RUN
--   Supabase  →  SQL Editor  →  New query  →  paste  →  Run.
--   Safe to re-run: every statement uses IF NOT EXISTS.
--
-- ADDITIVE. Builds on 007_availability.sql.
--
-- A member pastes their calendar's private iCal (.ics) link. We fetch it
-- server-side, read ONLY their busy time blocks for the next few weeks, and map
-- each to a date + slot. Those busy slots then count against their availability
-- (unless they manually override a slot to free). We never store event titles
-- or details, only that a slot is busy.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── The connected feed ────────────────────────────────────────────────────────
-- One private calendar link per member. tz is the member's IANA timezone,
-- captured in the browser when they connect, so we map event times to the right
-- morning/afternoon/evening slot.
create table if not exists calendar_feeds (
  clerk_user_id  text        primary key,
  ics_url        text        not null,
  tz             text        not null default 'UTC',
  status         text        not null default 'pending'
                   check (status in ('pending','ok','error')),
  last_error     text,
  last_synced_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- ── Derived busy blocks ───────────────────────────────────────────────────────
-- The result of parsing a member's feed: one row per (member, date, slot) that
-- their calendar marks busy. Fully replaced on every sync. No event details.
create table if not exists calendar_busy (
  id            uuid        primary key default gen_random_uuid(),
  clerk_user_id text        not null,
  on_date       date        not null,
  slot          text        not null check (slot in ('morning','afternoon','evening')),
  created_at    timestamptz not null default now(),
  unique (clerk_user_id, on_date, slot)
);

create index if not exists calendar_busy_user_idx
  on calendar_busy (clerk_user_id, on_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Rows are written by the app when a member connects or refreshes a feed.
-- ─────────────────────────────────────────────────────────────────────────────
