-- 017_assessment_provenance.sql
-- Two columns that are cheap now and impossible to backfill later.
--
-- WHY: the long-term aim is a leadership credential another church would
-- honor, and the argument for keeping these responses at all is that one day
-- they show what actually marked out a faithful leader. Neither works without
-- these two.
--
--   assessment_version  The question set changes. Ids are stable but wording is
--                       not, so an answer stored today and an answer stored in
--                       two years may be answers to different questions. Without
--                       a version stamp, the whole corpus quietly becomes
--                       uncomparable and there is no way to tell when.
--
--   outcome             Whether the person actually led, and how it went. Right
--                       now the only field is `status`, which records what was
--                       decided, never what happened. A dataset of decisions
--                       cannot tell you which decisions were right. Set this by
--                       hand at 12 months; there is no automatic path to it and
--                       there should not be.
--
-- Also sets the retention period the covenant review asked for. These rows hold
-- religious belief, church membership, named third parties, and voluntarily
-- disclosed personal struggle, some of it written by minors — 014 correctly
-- calls that special-category data. "We keep it forever because one day it will
-- be a dataset" is not a lawful basis, and n is about twelve.
--
-- SAFE TO RUN ANYTIME. Nothing in the app reads these yet.

alter table leader_assessments
  add column if not exists assessment_version text not null default '2026-08-13';

alter table leader_assessments
  add column if not exists outcome text;

comment on column leader_assessments.assessment_version is
  'Question-set version at submission. Answers are only comparable within a version.';

comment on column leader_assessments.outcome is
  'Set by hand, at least 12 months on: led-well | led-and-stepped-down | declined | never-led | removed. The only column that can ever say whether a decision was right.';

comment on table leader_assessments is
  'Special-category data (religious belief, church membership, personal disclosure, minors). RETENTION: 3 years from created_at for anyone not serving as a leader, and for the duration of service plus 3 years for anyone who leads. Delete on request, always, without asking why — the page promises this in three places. Review yearly.';
