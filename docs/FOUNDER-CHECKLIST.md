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

## Run in Supabase

- [ ] **Migration 013** (`db/migrations/013_reflect_one_per_day.sql`): one
  gratitude entry and one examen per member per day. Without it, a double tap
  can create two rows for the same day and that day's entry then stops loading
  for the member. Safe to run top to bottom; it clears any existing duplicates
  first, keeping the newest. The code already handles both states, so there is
  no rush and nothing breaks until you run it.

## Verify once (quick checks)

- [x] **Supabase migration 012** (`db/migrations/012_submissions.sql`): DONE,
  verified 2026-08-10 (SQL editor reported success). Form submissions are now
  durable.
- [ ] **hstspreload.org**: check christfields2717.com is submitted (the header
  is already sent; only the external submission is unverified).

## Decisions from the dashboard audit (settled 2026-08-10)

Four of the five were decided and implemented. Reverse any of them by saying so;
each is a small, self-contained change.

- [x] **Daily verse licensing: keep the ESV wording, add the notice.** The 20
  hand-typed verses in `lib/dashboard/content.ts` are ESV, which is
  copyrighted. Crossway's policy allows this many verses without written
  permission provided a copyright notice appears, so the notice now sits in
  Settings under "Scripture". The alternative, serving the daily verse from
  the public-domain WEB via `lib/bible`, was tested and rejected: the WEB
  renders "Yahweh is my shepherd" rather than "The LORD is my shepherd", which
  changes words members read every day. Say the word if you would rather have
  the public-domain text and accept that wording.
- [x] **Pages stay reachable by direct URL before they are revealed.** The
  progressive reveal exists so a new member is not overwhelmed, not to lock
  anyone out, and the "show me everything" preference already proves that
  intent. Redirecting a curious member away from a page they asked for would
  be the unkind version. Recorded as a comment in `lib/dashboard/journey.ts`.
- [x] **Leader analytics now count showing up.** Confirmed in-person
  attendance feeds "last active", so a member who comes every week but rarely
  opens the app no longer reads to their leader as "quiet for N days".
- [x] **Leaders keep the ability to reset or remove a memory verse**, because
  it is a deliberate feature for testing someone out loud, but members are now
  told plainly in Settings that a leader can do it.
- [ ] **The vanity-metric inventory** (the long-standing decision 2)
  **deliberately NOT actioned.** The council ruled this gets scoped by the
  five-questions conversation with real Iron & Ember members, and that has not
  happened yet, so stripping now would be guessing at what your people
  actually feel. The exact surfaces, ready for the day you have those answers:
  rhythm streaks (`RhythmCard.tsx:195`), Progress self-scores and targets
  (`ProgressBoard.tsx:411`), overview stat tiles (`page.tsx:284`), weekly
  counts (`streaks.ts:73`), Scripture review counts (`MemoryVerses.tsx:144`),
  community "N praying" tallies (`CommunityWall.tsx:361`), event "N going"
  (`EventBanner.tsx:231`), leader-side equivalents (`MembersBoard.tsx:325`).

## Leader readiness assessment — before you send the link to anyone

The page is built, audited, and counciled. These are the parts only you can do,
and the first two are hard gates.

- [ ] **A screening vendor. The under-18 door is CLOSED until you have one.**
  Not because you would accept a minor carelessly, but because the guardian
  notice leaves automatically the second a minor presses send, and it tells that
  parent their child would serve "always under a screened adult, meaning a
  background check and references, renewed." That is a promise about a child's
  safety, made to their parent, by a machine, before you have seen anything —
  and today nothing behind it can keep that promise. `c_screening` has the same
  problem: it asks for consent to a process that does not exist.

  So the form currently offers "18 or older" and "17 or younger", and the second
  one stops it kindly, saying plainly that we will not tell a parent their child
  is covered by something we have not built. The seventeen floor itself is
  unchanged and correct; the door is shut, not moved.

  **To open it, once screening is real:** set `MINOR_APPLICATIONS_OPEN = true`
  in `lib/leaders/assessment.ts`. One line, nothing else. The 17 band comes
  back on its own.
- [ ] **A Colorado attorney on one question:** the form promises answers are
  private to the Table, and it will eventually surface abuse. Under Colorado
  reporting law you may not be free to keep that promise, and this creates a
  written, dated record. The page now names the limit out loud, which is the
  right posture, but a lawyer should read the exact wording. Everything else in
  `docs/LEADER-ASSESSMENT.md` §7 can wait; this one cannot.
- [ ] **Appendix A, the Statement of Faith.** Covenant Section 1 requires
  agreement with a document that does not exist. The eight creedal items in
  `DOCTRINE` already are your statement of faith — one evening to write them up
  properly, and the covenant stops referencing a blank page.
- [ ] **Decide what a "no" sounds like.** A fifteen-year-old can spend half an
  hour telling you what they are struggling with, not be ready, and currently
  hear nothing back. Nothing automates a kind decline. Decide now what you will
  say, so you are not composing it for the first time while someone waits.
- [ ] **Write down how you delete someone's answers.** The page promises it in
  three places. At n=12 a manual delete is fine, but a promise with no written
  procedure behind it is one you will eventually fail to keep.
- [ ] **When you change a question, bump `assessment_version`** (migration 017).
  Ids stay stable, wording drifts, and answers to different questions cannot be
  compared later.
- [ ] **Set `outcome` by hand at twelve months** for anyone who leads. It is the
  only column that can ever tell you whether a decision was a good one, and it
  is the difference between a credential and a certificate.

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
