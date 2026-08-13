-- 014_leader_assessments.sql
-- Responses to the leader readiness assessment (/leaders/readiness).
--
-- This is the record the founder reviews, and the data the future leadership
-- credential would be built from, so it is stored rather than emailed only.
--
-- PRIVACY NOTE, read before using this table for anything else: these rows
-- contain religious belief, church membership, and voluntarily disclosed
-- personal struggles. In several jurisdictions that is special-category
-- personal data. Keep access to the founder, do not export it into general
-- analytics, and delete a row on request. See docs/LEADER-ASSESSMENT.md.
--
-- SAFE TO RUN ANYTIME. Until it is run, the form still works: submissions
-- fall back to the notification email alone, exactly like the public form did.

create table if not exists leader_assessments (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  email        text        not null,
  phone        text,
  church        text       not null,

  -- Covenant Sections 13 and 14: leaders under 18 serve under a screened adult
  -- and need a parent or guardian co-signature on the covenant.
  is_minor       boolean    not null default false,
  guardian_name  text,
  guardian_email text,

  -- Answer maps, keyed by the question ids in lib/leaders/assessment.ts.
  gates        jsonb       not null default '{}'::jsonb,
  doctrine     jsonb       not null default '{}'::jsonb,
  commitments  jsonb       not null default '{}'::jsonb,
  walk         jsonb       not null default '{}'::jsonb,
  scenarios    jsonb       not null default '{}'::jsonb,

  -- True when every gate and every doctrinal affirmation was met. Stored
  -- rather than recomputed so the record reflects the standard as it was on
  -- the day they answered, even if the questions change later.
  gate_passed  boolean     not null default false,

  -- Founder's own workflow. Untouched by the form.
  status       text        not null default 'new'
                 check (status in ('new','reviewing','conversation','approved','declined')),
  notes        text,

  emailed      boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists leader_assessments_created_idx
  on leader_assessments (created_at desc);

create index if not exists leader_assessments_status_idx
  on leader_assessments (status, created_at desc);

-- Deny by default for any non-service-role path, consistent with 010/011/012.
-- The app reaches this only through the service-role key, which bypasses RLS,
-- so enabling it changes nothing for the running app and closes the door on
-- everything else.
alter table leader_assessments enable row level security;
