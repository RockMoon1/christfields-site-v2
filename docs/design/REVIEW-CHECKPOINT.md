# Christ Fields implementation checkpoint

14 September, subsequent release authorization: the founder asked to push the
completed member-event, leader-control and posting-form batches. The
[event/leader release checkpoint](RELEASE-2026-09-14-EVENT-LEADER.md) records the
ten-file production scope and the matching 102 browser / 58 unit test evidence.
Earlier uncommitted-status statements below describe the pre-release checkpoints.

14 September, leader forms: [Posting-form review](POST-FORM-REVIEW.md) covers
PostForm and WhoIsFree. Readable fields, validation/focus, pending-save guards
and availability request/retry handling pass 20 new browser checks. All 102
combined dashboard tests, 58 unit tests, types, tables and production build
pass. Eight frozen-instrument screenshot pairs support the two-file batch;
earlier member and leader sources remain intact. All three post-release batches
are uncommitted and unpublished. Page shells/prefill, care and Scripture remain open.

14 September, next UI batch: [Leader event controls](LEADER-EVENT-REVIEW.md) adds
readable leader actions, truthful failed-save feedback, draft/focus recovery and
refreshed attendance. One production file changed; the preceding member batch is
intact. All 82 combined dashboard browser tests, 58 unit tests, type/table checks
and production build pass. Both new batches remain uncommitted and unpublished.
Two pre-existing service-result limitations are logged in that handoff for separate work.

14 September, after the release: [Member event review](MEMBER-EVENT-REVIEW.md)
records the next separate, uncommitted batch. It improves RSVP/calendar, planning,
bring lists and rides using OMC execution, independent review and verification.
All 66 combined dashboard browser checks, 58 unit tests, type/table checks and the
production build pass. Actual-page synthetic fixtures were inspected at 390/1280;
authenticated behavior remains unverified. Leader tools, care and Scripture remain open.

Latest update, 14 September: the founder authorized committing and pushing the completed work. The [release checkpoint](RELEASE-2026-09-14.md) records scope and fresh verification: 51 dashboard browser tests, 25 public browser tests, 58 unit tests, type/table checks and production build. Earlier handoffs below retain their historical review status and evidence; the remaining plan is still open.

9 September: [Dashboard Batch 3b](DASHBOARD-BATCH3B-REVIEW.md) covers prayer-wall labels, readable controls, touch targets, immediate content and conditional focus recovery. Its two-file review slice has eight before/after screenshot pairs from one frozen instrument. All 51 combined synthetic browser tests, 58 unit tests, type/table checks and production build pass. The handoff records the fixture boundary; Claude's independent review remains pending.

[Dashboard Batch 3a](DASHBOARD-BATCH3A-REVIEW.md), 8 September, covers settings and availability, with two review patches, 14 before/14 after screenshots from one frozen instrument, and 40 passing synthetic browser tests at that checkpoint. Authenticated flows, omitted push/Clerk behavior, other dashboard families, care, and Scripture remain explicitly unfinished.

[Batch 2 implementation and review handoff](PUBLIC-BATCH2-REVIEW.md) covers the growth story, static Scripture band, and local FaithFlow example, plus separately packaged practice-focus and Lenis-cleanup fixes. Its 25 public browser tests are a separate run. Independent Claude review remains the next boundary; the overall five-stage plan is incomplete.

Follow-up to independent review: [Foundation corrections and evidence](FOUNDATION-REVIEW-RESPONSE.md). Claude marks Packages 02 and 03c Ready, with ordinary Button navigation and rendered contrast independently reproduced in its browser. Modified-click and pending-state checks retain their separate Codex verification status. Scripture remains gated.

7 September 2026, America/Denver (8 September UTC). Codex implements; Claude reviews. This is a checkpoint for review, not a claim that all five stages are complete.

Original baseline: `b86e456844c72a5be39ccbc6406cb71a93b3e2db` on `main`. No commits, pushes, or deployments had been made at the earlier checkpoints. The founder authorized this release on 14 September; later work still requires an explicit commit/push request. Existing untracked `AGENTS.md` and `.agents/` are excluded from the implementation packages.

## Review packages

`scripts/package-design-review.mjs` creates separate patches under `.claude/recon/review-patches/`, with a manifest recording baseline, files, checksums, and reverse-application validation. It does not stage, commit, or apply anything. These are review slices of the current tree, not independently tested commits. Foundations supply shared dependencies for later slices. The production build and browser suite validate the combined checkpoint.

| Package | Implemented | Status and next boundary |
| --- | --- | --- |
| 00 — verification tooling | Playwright dev dependency, isolated component fixtures, browser checks, capture and packaging scripts | Review tooling; no runtime dependency added |
| 01 — Scripture inventory | Cached source/provenance, all 522 transcription comparisons, quotation inventory, initial contextual records and concern log | Incomplete: 483 corpus context reviews remain; Stage 5 gate is false |
| 02 — foundations | Shared design standard, tokens, eight UI files, extended existing Button, reactive motion preference, custom typography merging | Ready per Claude review; ordinary navigation reproduced, broad call-site migration remains |
| 03a — motion/navigation | Immediate reduced-motion states in shared components, live preference changes, stable forms, mobile dialog focus, keyboard feedback, transform-based preview bars | Scoped repairs verified; full public scene audit still pending |
| 03b — public composition | Asymmetric homepage, reordered sections, immediate journal prose with 65ch measure and one progress indicator | Draft, not a completed Stage 3 |
| 03c — public contrast | Practice/time labels meet the type floor, three text colors corrected, rail fade confined to its gutter | [Ready per Claude's independent browser review](PUBLIC-CONTRAST-REVIEW.md); evidence-method corrections documented |
| 04 — dashboard repairs | Safe-area header, route headings/skeletons, prayer/RSVP failure feedback, confirmation behavior, stable roster controls, Clerk appearance deduplication and route correction | Tested with synthetic fixtures; full migration and authenticated verification remain |

## Keep / change / remove

| Before | Current checkpoint | Reason |
| --- | --- | --- |
| Existing green/gold/ivory, Cormorant/Inter, logo | Kept | Refine the existing identity |
| Repeated form and surface styling | Added shared primitives without a wholesale migration | Establish consistent labels, errors, native controls, pending states and spacing |
| Custom display text classes could be removed by the installed class merger | Registered the project's custom font-size classes | Preserve intended size and color together |
| Mobile menu could lose keyboard containment | Native modal dialog plus explicit Tab wrapping, Escape and focus return | Contain keyboard focus and isolate background content |
| Shared motion could survive a preference change or remount a form | Reactive preference with stable wrappers and immediate final states | Respect live preferences while preserving unsent drafts |
| Normal-motion headings could remain clipped forever | Observe the stationary mask to trigger the existing heading rise | Remove an intersection-observer deadlock while preserving choreography |
| A disabled link-button retained a navigable destination | Disabled/pending links have no href; active links retain normal behavior | Also block middle-click and context-menu navigation |
| Preview bars changed layout width | Fixed layout dimensions with transform animation | Avoid layout changes on each animation frame |
| Homepage had a centered composition and small quotation | Left heading/actions, right selectable quotation panel | Make the existing words easier to read; wording and reference are unchanged |
| Journal blocks waited for entrances | Static prose and quotations; one article progress indicator | Make reading immediately available |
| Header safe-area padding consumed its fixed content height | Separate inset wrapper and 64px row | A simulated 47px inset now produces a 111px total header |
| Prayer and RSVP failures silently rolled back | Persistent announced failures; exact prayer draft restored; RSVP status/faces restored | Make failed actions understandable and retryable |
| Confirmation lacked complete pending/error/focus behavior | Improved existing ConfirmAction | Prepare safe reflection deletion adoption in its separate care-card change |

The old homepage statistics band is no longer rendered; its component remains. Batch 2 subsequently implemented the growth story, static Scripture band, and FaithFlow illustration/claims. Broad migration, care card, reflection-deletion adoption, and Scripture context UI remain outstanding. No quotation substitutions have been made. Evidence below describes the earlier foundation checkpoint; use the latest handoffs above for subsequent runs.

## Evidence

Baseline type checks, 57 unit tests, table checks, and production build passed before changes. At this checkpoint, type checks, 58 unit tests across 11 files, table checks, and production build pass. Browser coverage now comprises 28 passing checks: the combined 26-test run, a passing additional disabled-link test, and an 11-test public-motion rerun including the new clipped-heading regression. These were separate runs, not a single 28-test invocation. Details are recorded in `.claude/recon/verification/`.

- Unit output: `.claude/recon/verification/unit-tests.log`.
- Build output: `.claude/recon/verification/production-build.log`.
- Built-homepage browser observation: `.claude/recon/verification/production-browser.json` (HTTP 200, no horizontal overflow, heading visible in its mask). This check blocks authentication prefetches and mutations; it does not certify authenticated routes.
- Table output: `.claude/recon/verification/table-check.log`.
- Browser result: `.claude/recon/verification/browser-result.json`; suite sources and isolation details are in `tests/browser/README.md`.
- Final public-motion output: `.claude/recon/verification/public-motion-final.log`; disabled-link output: `.claude/recon/verification/button-link-test.log`.
- Impeccable detector: `.claude/recon/verification/impeccable.json` is `[]` for the checked primitives, Button, Nav, Hero and TopBar. This is a scoped detector result, not a site-wide accessibility certification.
- Public captures: `.claude/recon/shots/{before,after}/`. Before references exist for home, FaithFlow, ScholarFlow, and the journal article at requested 390/1280 browser widths. The in-app capture actually produced JPEG content at 375/1265px wide and 844px high, despite the `.png` filenames. After captures are Playwright PNGs at 390/768/1280/1920, with 844px mobile and 900px desktop heights. Treat these as visual references, not identical-renderer pixel baselines. All 16 after-page measurements found no horizontal overflow. No automated pixel comparison was run.
- Durable foundation fixture screenshots: `.claude/recon/shots/after/foundations-{390,768,1280,1920}.png`, with `foundations-capture.json`. The fixtures use local font fallbacks and synthetic data; they demonstrate component layout and state, not the final production font rendering.

The browser checks cover menu focus/Escape/return, short-menu scrolling and anchors, viewport changes, live reduced motion and preserved draft state, control labels/error space, pending dimensions, all four prayer failure paths, RSVP rollback, confirmation retry/focus, safe-area geometry, and loading widths. Public requests reject mutations; fixture service actions are replaced before loading. No real prayers, notifications, accounts, or emergency contacts were used.

Token-based active-text contrast calculations for the checked foundations range from 5.42:1 to 10.90:1, including placeholder/error/notice text and button variants. These calculations do not replace a full computed-background contrast sweep across all pages. Disabled controls were considered separately. Browser focus and minimum target checks apply only to the tested controls.

Not yet verified: authenticated dashboard flows and Clerk popovers, a physical installed iOS PWA, the full 320px/landscape/200% zoom matrix, every existing public animation, full-site contrast and touch targets, and the untouched care card. Fixture evidence must not be described as authenticated end-to-end evidence.

## Scripture gate and frozen scope

All 522 entries match the pinned provider source after whitespace normalization. This establishes transcription fidelity. It does not prove equivalence to a particular eBible stable edition release. Translation, edition uncertainty, provider snapshot, retrieval information and checksum are recorded separately in `docs/scripture/`.

The 83 quotation-mark flags and 38 terminal punctuation flags remain faithful excerpts, not automatically repaired defects. There are 35 initial contextual records covering 39 corpus passages plus public quotations; 483 corpus entries still need contextual review. A first-pass record is not founder or independent-review approval.

The source cache is 1.61 MB for 335 chapters and is not imported by application code. No member payload size or completed hermeneutic review is claimed. The audit script refreshed tracked source locations; new primitives were separately checked for Scripture quotations. Public/member-supplied text has not been silently rewritten.

The package manifest verifies unchanged corpus, tags, selection modules, calendar logic, membership authorization, and public-event filtering against the baseline. No DB migration, new API route, auth/role change, notification or scheduling contract change, member privacy change, or GraceFlow edit belongs to this checkpoint.

Next: Claude reviews these slices and evidence, with the public composition treated as a draft. Resume one component family or public scene at a time after resolving checkpoint findings. Keep the care card isolated and keep revised Scripture presentation gated on the completed review.

## Follow-up: missing growth illustrations

The founder reported broken images in the four-stage growth section. The local preview server was no longer listening, and the existing in-app page showed all four optimized image requests as complete with zero natural width. After starting the preview and reloading that same tab, all four decoded successfully, including its 640px image variants. A desktop screenshot in the actual in-app browser confirmed the seed globe was visible again.

All four original WebP assets are intact, 1024×1024, and unchanged from HEAD. A fresh Chromium session also received HTTP 200 image responses for every stage. No illustration, layout, image configuration, or application code was changed for this report.

Added `tests/browser/journey-images.pw.ts`: two passing checks at 1x and 2x pixel density, each resizing through 390 → 768 → 1280 → 1920 → 390 and verifying that all four images decode without horizontal overflow. Output: `.claude/recon/verification/journey-images-tests.log`. These are two additional checks beyond the 28-check checkpoint above. The exact historical reason the original requests failed was not recoverable; this evidence establishes restored preview behavior, not an unobserved optimizer defect.
