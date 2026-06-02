-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields — AI verse usage (a hard daily cap per member)
--
-- HOW TO RUN
--   Supabase  →  SQL Editor  →  New query  →  paste  →  Run.
--   Safe to re-run.
--
-- One row per member per day, counting how many times they used the
-- "a verse for what you are carrying" AI. The route enforces a small daily cap
-- so no one can overuse it and we never blow the free quota. Until this table
-- exists, the route falls back to an in-memory burst limit, so it still works.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ai_verse_usage (
  clerk_user_id text        not null,
  on_date       date        not null,
  count         int         not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (clerk_user_id, on_date)
);
