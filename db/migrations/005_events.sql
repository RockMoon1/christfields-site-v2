-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields — Events (the animated banner + RSVP)
--
-- HOW TO RUN
--   Supabase  →  SQL Editor  →  New query  →  paste this whole file  →  Run.
--   Safe to re-run any time: every statement uses IF NOT EXISTS.
--
-- ADDITIVE. Complements the other db/*.sql files; touches nothing existing.
--
-- Leaders and masters create events for a FaithFlow group (a Clerk org). Every
-- member of that org sees an animated banner on their dashboard and marks
-- going / not going. Everything keys off Clerk ids; no RLS, because all access
-- goes through Clerk-authenticated server actions using the service-role key.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Events ────────────────────────────────────────────────────────────────────
-- One row per event. event_type drives the banner's lighting + motion on the
-- member dashboard (see lib/dashboard/events.ts). starts_at is when it happens.
create table if not exists events (
  id          uuid        primary key default gen_random_uuid(),
  org_id      text        not null,            -- Clerk organization (the group)
  created_by  text        not null,            -- leader/master Clerk user id
  title       text        not null,
  description text        not null default '',
  event_type  text        not null default 'gathering',
  location    text        not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists events_org_idx on events (org_id, starts_at);


-- ── RSVPs ──────────────────────────────────────────────────────────────────────
-- One row per member per event. status is 'going' or 'not_going'; no row means
-- they have not responded yet.
create table if not exists event_rsvps (
  id            uuid        primary key default gen_random_uuid(),
  event_id      uuid        not null references events(id) on delete cascade,
  clerk_user_id text        not null,
  status        text        not null check (status in ('going','not_going')),
  updated_at    timestamptz not null default now(),
  unique (event_id, clerk_user_id)
);

create index if not exists event_rsvps_event_idx on event_rsvps (event_id);
create index if not exists event_rsvps_user_idx  on event_rsvps (clerk_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Rows are created by the app as needed — no seed data required here.
-- ─────────────────────────────────────────────────────────────────────────────
