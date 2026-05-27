-- ─────────────────────────────────────────────────────────────────────────────
-- Christ Fields — Reframe the Sabbath rhythm as a daily rest in Christ
--
-- HOW TO RUN
--   Supabase  →  SQL Editor  →  New query  →  paste  →  Run.
--   Safe to re-run: it only sets fixed values, and only on the Sabbath preset.
--
-- The Sabbath starter card used to default to once a week ("One day to rest and
-- receive"). New accounts now get a daily rest-in-Christ card from the app code
-- (see app/dashboard/(app)/rhythms/actions.ts). This one-time update brings
-- EXISTING accounts in line. Preset cards are not user-editable, so this
-- clobbers no personal data.
-- ─────────────────────────────────────────────────────────────────────────────

update practices
set
  description     = 'Rest in Jesus. Not one day only, but every day.',
  cadence         = 'daily',
  target_per_week = 7,
  scripture       = 'Hebrews 4:9-10',
  anchor          = 'When today gets heavy, I will stop and come to Jesus to rest.'
where preset_key = 'sabbath';
