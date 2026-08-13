-- 016_assessment_visibility.sql
-- Which of an under-18 applicant's written answers they chose to share with
-- their parent or guardian. Keyed by the same question ids as walk/scenarios.
--
-- Stored so the record shows exactly what the guardian was sent, which matters
-- if anyone ever asks. Empty for applicants 18 or over, who are never shown the
-- switches.
--
-- A separate migration because 014 has already been run.
-- SAFE TO RUN ANYTIME. Until it is run, the switches still work and the
-- guardian email still respects them; only the record of the choice is lost.
--
-- That is only true because the server retries the insert without this column
-- when PostgREST reports it missing (PGRST204). Without that retry PostgREST
-- would reject the entire row, and every submission would be lost, not just the
-- record of the choice. If you ever remove the retry, run this first.

alter table leader_assessments
  add column if not exists visibility jsonb not null default '{}'::jsonb;
