-- ─────────────────────────────────────────────────────────────────────────────
-- 018_schedule_manager.sql
-- Christ Fields dashboard rewrite: the community schedule manager.
--
-- HOW TO RUN
--   Supabase → SQL Editor → New query → paste this whole file → Run.
--   Safe to re-run: every statement is idempotent. Run BEFORE deploying the
--   rewrite (the new code reads these columns and tables).
--
-- ADDITIVE. Nothing is dropped here. The teaching tables are dropped later by
-- 019_drop_teaching.sql, by hand, after the rewrite has been live for a week.
--
-- This file also supersedes 010_rls.sql: it enables RLS (no policies, deny by
-- default for any non-service-role path) on every table that survives plus
-- every table it creates. The app reaches Supabase only with the service-role
-- key, which bypasses RLS, so this changes nothing for the running app.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── events: soft cancel, change tracking, recurrence, tz, prompts ─────────────
alter table events
  add column if not exists status        text not null default 'scheduled',
  add column if not exists cancelled_at  timestamptz,
  add column if not exists cancel_reason text not null default '',
  add column if not exists updated_at    timestamptz not null default now(),
  add column if not exists version       int  not null default 0,
  add column if not exists tz            text not null default 'America/Denver',
  add column if not exists series_id     uuid,
  add column if not exists member_note   text not null default '',
  add column if not exists leader_note   text not null default '',
  add column if not exists thanks_note   text not null default '',
  add column if not exists rides_enabled boolean not null default false,
  add column if not exists host_user_id  text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'events_status_check') then
    alter table public.events add constraint events_status_check
      check (status in ('scheduled','cancelled'));
  end if;
end $$;

-- Five plain event types. Old church-flavoured types fold into the nearest one.
update events set event_type = case event_type
  when 'worship' then 'gathering'
  when 'prayer'  then 'gathering'
  when 'social'  then 'meal'
  when 'service' then 'serve'
  else event_type end
where event_type in ('worship','prayer','social','service');

create index if not exists events_org_status_idx on events (org_id, status, starts_at);
create index if not exists events_series_idx     on events (series_id);


-- ── event_rsvps: three states, private plan, snapshot identity, first-timer ──
-- 005 declared the status CHECK inline (auto-named), so find it by definition.
do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.event_rsvps'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%status%';
  if c is not null then
    execute format('alter table public.event_rsvps drop constraint %I', c);
  end if;
  alter table public.event_rsvps add constraint event_rsvps_status_check
    check (status in ('going','maybe','not_going'));
end $$;

alter table event_rsvps
  add column if not exists plan         text    not null default '',
  add column if not exists display_name text    not null default '',
  add column if not exists image_url    text    not null default '',
  add column if not exists first_time   boolean not null default false;


-- ── event_attendance: who actually came, per event ────────────────────────────
create table if not exists event_attendance (
  event_id      uuid        not null references events(id) on delete cascade,
  clerk_user_id text        not null,
  present       boolean     not null,
  marked_by     text        not null,
  marked_at     timestamptz not null default now(),
  primary key (event_id, clerk_user_id)
);


-- ── org_member_seen: seeded from history BEFORE 019 drops group_attendance ────
-- Feeds the first-timer line and the Say hi list, so no existing member is ever
-- flagged as new on launch day.
create table if not exists org_member_seen (
  org_id        text        not null,
  clerk_user_id text        not null,
  first_seen_at timestamptz not null default now(),
  primary key (org_id, clerk_user_id)
);

do $$ begin
  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'group_attendance') then
    insert into org_member_seen (org_id, clerk_user_id, first_seen_at)
    select org_id, clerk_user_id, min(gathering_date)::timestamptz
      from group_attendance
     where checked_in or confirmed
     group by 1, 2
    on conflict do nothing;
  end if;
end $$;

insert into org_member_seen (org_id, clerk_user_id, first_seen_at)
select e.org_id, r.clerk_user_id, min(r.updated_at)
  from event_rsvps r join events e on e.id = r.event_id
 where r.status = 'going'
 group by 1, 2
on conflict do nothing;


-- ── event_slots + claims: bring-something and rides ───────────────────────────
create table if not exists event_slots (
  id         uuid        primary key default gen_random_uuid(),
  event_id   uuid        not null references events(id) on delete cascade,
  kind       text        not null check (kind in ('bring','ride')),
  label      text        not null,
  capacity   int         not null default 1,
  created_by text        not null,
  created_at timestamptz not null default now()
);
create index if not exists event_slots_event_idx on event_slots (event_id);

create table if not exists event_slot_claims (
  slot_id       uuid        not null references event_slots(id) on delete cascade,
  clerk_user_id text        not null,
  display_name  text        not null default '',
  qty           int         not null default 1,
  created_at    timestamptz not null default now(),
  primary key (slot_id, clerk_user_id)
);


-- ── event_changes: one row per org-level change (the Changed strip) ──────────
create table if not exists event_changes (
  id         uuid        primary key default gen_random_uuid(),
  org_id     text        not null,
  event_id   uuid        not null references events(id) on delete cascade,
  kind       text        not null check (kind in ('created','changed','cancelled','thanks')),
  summary    text        not null default '',
  created_by text        not null,
  created_at timestamptz not null default now()
);
create index if not exists event_changes_org_idx on event_changes (org_id, created_at desc);


-- ── notification_deliveries: dedupe + budget ledger; no bodies stored ────────
create table if not exists notification_deliveries (
  id            uuid        primary key default gen_random_uuid(),
  dedupe_key    text        not null,
  clerk_user_id text        not null,
  channel       text        not null check (channel in ('push','email','broadcast')),
  status        text        not null check (status in ('pending','sent','failed','skipped_budget','skipped_quiet')),
  provider_id   text,
  created_at    timestamptz not null default now(),
  unique (dedupe_key, clerk_user_id, channel)
);
create index if not exists notification_deliveries_created_idx on notification_deliveries (created_at);


-- ── push_subscriptions ────────────────────────────────────────────────────────
create table if not exists push_subscriptions (
  id            uuid        primary key default gen_random_uuid(),
  clerk_user_id text        not null,
  endpoint      text        not null unique,
  p256dh        text        not null,
  auth          text        not null,
  user_agent    text        not null default '',
  created_at    timestamptz not null default now(),
  last_ok_at    timestamptz,
  fail_count    int         not null default 0
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (clerk_user_id);


-- ── member_prefs: replaces dashboard_prefs ────────────────────────────────────
create table if not exists member_prefs (
  clerk_user_id      text        primary key,
  tz                 text        not null default 'UTC',
  email_reminders    boolean     not null default true,
  hello_seen         boolean     not null default false,
  install_nudge_seen boolean     not null default false,
  push_primer_seen   boolean     not null default false,
  free_nudge_seen    boolean     not null default false,
  feed_token         text        unique,
  updated_at         timestamptz not null default now()
);


-- ── calendar_busy: source tag; unique constraint swapped by lookup ────────────
alter table calendar_busy
  add column if not exists source text not null default 'ics';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'calendar_busy_source_check') then
    alter table public.calendar_busy add constraint calendar_busy_source_check
      check (source in ('ics','google'));
  end if;
end $$;

do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.calendar_busy'::regclass and contype = 'u'
     and pg_get_constraintdef(oid) like '%(clerk_user_id, on_date, slot)%';
  if c is not null then
    execute format('alter table public.calendar_busy drop constraint %I', c);
  end if;
  if not exists (select 1 from pg_constraint
                  where conname = 'calendar_busy_user_date_slot_source_key') then
    alter table public.calendar_busy
      add constraint calendar_busy_user_date_slot_source_key
      unique (clerk_user_id, on_date, slot, source);
  end if;
end $$;

-- The private .ics link moves to encrypted-at-rest (AES-256-GCM, CALENDAR_TOKEN_KEY).
alter table calendar_feeds add column if not exists ics_url_enc text;


-- ── Phase 3 tables (Google Calendar), created now so 018 is the only additive
--    migration the rewrite needs ────────────────────────────────────────────────
create table if not exists google_connections (
  clerk_user_id     text        primary key,
  google_sub        text,
  refresh_token_enc text        not null,
  scopes            text[]      not null default '{}',
  cf_calendar_id    text,
  status            text        not null default 'ok' check (status in ('ok','revoked','error')),
  last_error        text,
  last_freebusy_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists calendar_pushes (
  event_id        uuid        not null references events(id) on delete cascade,
  clerk_user_id   text        not null,
  google_event_id text        not null,
  event_version   int         not null default 0,
  pushed_at       timestamptz not null default now(),
  primary key (event_id, clerk_user_id)
);


-- ── RLS on, no policies, for every surviving and new table ───────────────────
alter table events                  enable row level security;
alter table event_rsvps             enable row level security;
alter table event_attendance        enable row level security;
alter table org_member_seen         enable row level security;
alter table event_slots             enable row level security;
alter table event_slot_claims       enable row level security;
alter table event_changes           enable row level security;
alter table notification_deliveries enable row level security;
alter table push_subscriptions      enable row level security;
alter table member_prefs            enable row level security;
alter table availability_weekly     enable row level security;
alter table availability_overrides  enable row level security;
alter table calendar_feeds          enable row level security;
alter table calendar_busy           enable row level security;
alter table community_prayers       enable row level security;
alter table community_intercessions enable row level security;
alter table google_connections      enable row level security;
alter table calendar_pushes         enable row level security;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='rate_limit_counters') then
    alter table public.rate_limit_counters enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='public_submissions') then
    alter table public.public_submissions enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='leader_assessments') then
    alter table public.leader_assessments enable row level security;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Next: deploy the rewrite. A week later, run 019_drop_teaching.sql by hand.
-- Do NOT run the older pending 013_reflect_one_per_day.sql; its tables are dropped.
-- ─────────────────────────────────────────────────────────────────────────────
