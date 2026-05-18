-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: each area carries a color, used to tie the card and the
-- corresponding orb dot together visually.
--
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

alter table progress_areas
  add column if not exists color text default '#c9a548';
