-- 015_guardian_emailed.sql
-- Records that the guardian notice for an under-18 applicant was ACCEPTED FOR
-- DELIVERY by the mail provider. A separate migration because 014 is already run.
--
-- Read it as "we handed it over", not "they got it". A false here is unambiguous
-- and worth acting on: the send errored, or the key was missing, or a rate limit
-- suppressed it, and a parent is owed a call the code did not make.
--
-- A true here is weaker than it looks. Bounces arrive asynchronously and there
-- is no Resend webhook in this repo, so a dead or mistyped guardian address
-- still records true. Until such a route exists, the real confirmation that a
-- parent heard is the in-person covenant walkthrough. Do not treat this column
-- as proof anyone read anything.
--
-- SAFE TO RUN ANYTIME. Until it is run, the notice still sends; the flag just
-- cannot be recorded, and the server logs a hint pointing here.

alter table leader_assessments
  add column if not exists guardian_emailed boolean not null default false;
