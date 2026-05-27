-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields — Availability (so leaders can plan around everyone's schedule)
--
-- HOW TO RUN
--   Supabase  →  SQL Editor  →  New query  →  paste  →  Run.
--   Safe to re-run: every statement uses IF NOT EXISTS.
--
-- ADDITIVE. Touches nothing existing.
--
-- Members mark when they are usually free (a weekly pattern) and can override
-- specific dates. Leaders see an aggregated free/busy heatmap to pick the best
-- time to gather. A later migration adds calendar-link (.ics) auto-sync.
--
-- Time is bucketed into three coarse slots per day so planning stays simple:
--   morning, afternoon, evening.
-- Everything keys off clerk_user_id; no RLS (Clerk-authenticated server actions).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Usual weekly availability ─────────────────────────────────────────────────
-- One row per (member, weekday, slot) the member marked as usually free.
-- A missing row means "not usually free" for that weekday + slot.
-- weekday: 0 = Sunday ... 6 = Saturday (matches JS Date.getUTCDay()).
create table if not exists availability_weekly (
  id            uuid        primary key default gen_random_uuid(),
  clerk_user_id text        not null,
  weekday       smallint    not null check (weekday between 0 and 6),
  slot          text        not null check (slot in ('morning','afternoon','evening')),
  created_at    timestamptz not null default now(),
  unique (clerk_user_id, weekday, slot)
);

create index if not exists availability_weekly_user_idx
  on availability_weekly (clerk_user_id);


-- ── Specific-date overrides ───────────────────────────────────────────────────
-- Explicitly free or busy on a particular date + slot, overriding the weekly
-- pattern. available = true means free, false means busy.
create table if not exists availability_overrides (
  id            uuid        primary key default gen_random_uuid(),
  clerk_user_id text        not null,
  on_date       date        not null,
  slot          text        not null check (slot in ('morning','afternoon','evening')),
  available     boolean     not null,
  created_at    timestamptz not null default now(),
  unique (clerk_user_id, on_date, slot)
);

create index if not exists availability_overrides_user_idx
  on availability_overrides (clerk_user_id, on_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Rows are created by the app as members set their availability.
-- ─────────────────────────────────────────────────────────────────────────────
