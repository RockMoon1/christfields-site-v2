-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields — Dashboard v3 schema (the "grows with you" journey)
--
-- HOW TO RUN
--   Supabase  →  SQL Editor  →  New query  →  paste this whole file  →  Run.
--   Safe to re-run any time: every statement uses IF NOT EXISTS.
--
-- This file is ADDITIVE. It complements db/schema.sql and db/dashboard-v2.sql.
-- Running it will NOT touch, alter, or drop anything that already exists.
--
-- It adds two things:
--   1. dashboard_prefs   — one row per member. Holds the quiet state behind the
--                          adaptive dashboard: when their journey began, the
--                          highest stage we have already shown the gentle
--                          "crossing" moment for, whether they have opted to see
--                          everything, and whether they have seen the welcome.
--                          The journey STAGE itself is never stored — it is
--                          computed live from real activity, so it cannot drift.
--   2. group_attendance  — in-person presence. Members check in ("I was there"),
--                          leaders confirm. Only leader-confirmed weeks count
--                          toward the gate that unlocks the deeper stages.
--
-- Everything keys off clerk_user_id (text). No RLS: access is through Clerk-
-- authenticated Next.js server actions using the service-role key (server only).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Dashboard preferences / journey state ────────────────────────────────────
-- journey_started_at is set when the row is first created (a member's first
-- dashboard load). ENGAGEMENT signals are counted from this point, so when this
-- ships everyone begins fresh at the first stage and grows from here.
-- ATTENDANCE deliberately is NOT: confirmed in-person weeks count for a member's
-- whole history (lib/dashboard/journey-data.ts), because showing up before the
-- dashboard existed still counted.
create table if not exists dashboard_prefs (
  clerk_user_id      text primary key,
  reveal_all         boolean     not null default false,
  welcome_seen       boolean     not null default false,
  journey_seen_stage text        not null default 'seed'
                       check (journey_seen_stage in ('seed','sprout','roots','fruit')),
  journey_started_at timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);


-- ── In-person attendance ──────────────────────────────────────────────────────
-- One row per member per gathering. gathering_date is the anchor (the Sunday,
-- UTC) of the week the member attended, so there is at most one attendance per
-- member per week. checked_in = the member said "I was there"; confirmed = a
-- leader confirmed it. Only confirmed attendance counts toward the gate.
create table if not exists group_attendance (
  id             uuid        primary key default gen_random_uuid(),
  org_id         text        not null,           -- Clerk organization (the FaithFlow group)
  clerk_user_id  text        not null,           -- the member who attended
  gathering_date date        not null,           -- week anchor (Sunday, UTC)
  checked_in     boolean     not null default false,
  confirmed      boolean     not null default false,
  confirmed_by   text,                            -- leader's Clerk user id
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (org_id, clerk_user_id, gathering_date)
);

create index if not exists group_attendance_user_idx
  on group_attendance (clerk_user_id, gathering_date desc);
create index if not exists group_attendance_org_idx
  on group_attendance (org_id, gathering_date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. The dashboard_prefs row and any attendance rows are created by the app
-- as needed — no seed data required here.
-- ─────────────────────────────────────────────────────────────────────────────
