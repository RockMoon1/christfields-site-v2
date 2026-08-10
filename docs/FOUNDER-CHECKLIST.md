# Founder checklist — the things only you can do

Updated 2026-08-10. This file exists so nothing lives only in a chat log.
Check items off by editing this file, or ask any Claude session to update it.

## Open — needs you

- [ ] **Iron & Ember auto-enroll (deliberately parked 2026-08-10).** The code is
  live but inert. To activate: in Clerk (Production instance) the org exists
  (`org_3EexE8Ynjxyz8pm2tCitG7iG4Yy`); in Netlify, delete the two broken env
  rows (the ones whose *names* are an org id and a whsec value), then add
  properly: key `MAIN_COMMUNITY_ORG_ID` = the org id, key
  `CLERK_WEBHOOK_SIGNING_SECRET` = the webhook signing secret (rotate it in
  Clerk first — the old one appeared in a screenshot), then trigger a deploy.
  Verify: `POST https://christfields2717.com/api/clerk-webhook` should answer
  400, not 503. Until then: new members are NOT auto-added to the main
  community org, and check-ins use the old single-group behavior. Nothing is
  broken; the feature is just off.
- [ ] **YouVersion eligibility note.** Fully drafted in
  `docs/youversion-application.md`. Send it via platform.youversion.com/support,
  then submit the application. Unlocks NIV verse text in FaithFlow later.
- [ ] **The Christ Fields CO test (council verdict 2026-08-09).** At the next
  Iron & Ember gathering, say "Christ Fields CO, our Colorado" out loud. If the
  room picks it up, it goes into the member dashboard welcome copy. It never
  goes on the public site either way.
- [ ] **The five-questions conversation** (from `B:\graceflow\GO-LIVE-WEEK.md`,
  Step 3). Ask Iron & Ember the five dashboard questions and write answers down
  verbatim. This is the research that unlocks dashboard decisions below.
- [ ] **Dashboard decisions 2–5** (see `docs/faithflow-dashboard-community.md`):
  strip streaks/self-scores and spotlight "who's coming this week" are the
  council-recommended safe pair; Rhythms/Reflect scope and the covenant screen
  wait for the five-questions answers.
- [ ] **First Instagram post.** Brand brief + 14 ideas: `docs/instagram-brand-brief.md`.
  The restructure journal post (/journal/iron-and-ember-our-community) is
  ready-made first content.
- [ ] **Probely console.** Mark the four triaged findings per
  `SECURITY-SCAN-TRIAGE.md` (3 false positive, 1 accepted risk), re-run the scan.

## Verify once (quick checks)

- [x] **Supabase migration 012** (`db/migrations/012_submissions.sql`): DONE,
  verified 2026-08-10 (SQL editor reported success). Form submissions are now
  durable.
- [ ] **hstspreload.org**: check christfields2717.com is submitted (the header
  is already sent; only the external submission is unverified).

## Deliberately deferred (on purpose, not forgotten)

- CSP nonce migration and RLS Phase B (own tested passes; see `SECURITY.md`).
- Delete-my-data / data-export flow (post-beta).
- Orphaned tables `member_notes` + `ai_verse_usage` (harmless; drop whenever).
- `NVIDIA_API_KEY` in Netlify is unused since June (safe to delete anytime).
- Stripe LIVE + the ten asks: parked by your beta-season decision
  (`B:\graceflow\GO-LIVE-WEEK.md` is the ready-to-run checklist).
- GraceFlow work (LearnFlow Study World stage 1, whole-Bible Phase 3) lives in
  `B:\graceflow`, not this repo.
- Next.js security upgrade: running in its own session (npm audit highs).
