-- ─────────────────────────────────────────────────────────────────────────────
-- 020_more_into_it.sql
-- Christ Fields dashboard, Phase 4: Scripture on a post, the quiet question,
-- the two-week rhythm.
--
-- HOW TO RUN
--   Supabase → SQL Editor → New query → paste this whole file → Run.
--   Safe to re-run: every statement is idempotent. Run BEFORE deploying
--   Phase 4 (the new code reads these columns and this table).
--
-- ADDITIVE. Nothing is dropped. Independent of 019 (run either first).
--
-- What it adds
--   events.scripture_ref / scripture_text / scripture_why / discussion
--     Optional passage for a gathering, one line on why, up to three
--     questions for the group. Member-visible through toMemberEvent().
--   events.context_notes
--     Historical / interpretive notes. LEADER-ONLY, never sent to members.
--   member_prefs.share_themes
--     Whether a theme word (never text) from this member's quiet reflections
--     may reach their leader. Default on; switched off on the You page.
--   member_prefs.rhythm_nudged_at
--     When we last showed "it has been a couple of weeks". At most every 14 days.
--   quiet_reflections
--     A member's private answer to a quiet question. body_enc is AES-256-GCM
--     under CALENDAR_TOKEN_KEY (lib/security/crypto.ts); nobody but the author
--     ever reads it back. themes holds the confirmed theme words; safety marks
--     an entry whose words matched the crisis patterns (never shown as a theme).
-- ─────────────────────────────────────────────────────────────────────────────

alter table events
  add column if not exists scripture_ref  text not null default '',
  add column if not exists scripture_text text not null default '',
  add column if not exists scripture_why  text not null default '',
  add column if not exists discussion     text not null default '',
  add column if not exists context_notes  text not null default '';

alter table member_prefs
  add column if not exists share_themes     boolean not null default true,
  add column if not exists rhythm_nudged_at timestamptz;

create table if not exists quiet_reflections (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text        not null,
  question_key  text        not null default '',
  body_enc      text        not null,
  themes        text[]      not null default '{}',
  confirmed     boolean     not null default false,
  safety        boolean     not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists quiet_reflections_user_idx on quiet_reflections (clerk_user_id, created_at desc);
create index if not exists quiet_reflections_created_idx on quiet_reflections (created_at);

-- Deny by default for any non-service-role path (consistent with 018).
alter table quiet_reflections enable row level security;
