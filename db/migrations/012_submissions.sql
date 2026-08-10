-- 012_submissions.sql
-- Durable record of public form submissions (/api/submit). Email via Resend is
-- the notification path, but email alone can silently drop people: a missing or
-- rotated RESEND_API_KEY used to return a fake success, and a spam-foldered
-- notification loses the person forever. This table is the primary record; the
-- email becomes a notification of it.
--
-- SAFE TO RUN ANYTIME. Until it is run, /api/submit detects the missing table
-- and keeps today's email-only behavior. After it is run, the same code starts
-- writing durable rows with no further changes.

create table if not exists public_submissions (
  id         uuid        primary key default gen_random_uuid(),
  form_name  text        not null,
  name       text        not null,
  email      text        not null,
  interest   text,
  message    text,
  emailed    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists public_submissions_created_idx
  on public_submissions (created_at desc);

-- Defense-in-depth, consistent with 010_rls.sql: deny by default for any
-- non-service-role access path. The app reaches this only via the service-role
-- key (which bypasses RLS), so enabling it changes nothing for the running app.
alter table public_submissions enable row level security;
