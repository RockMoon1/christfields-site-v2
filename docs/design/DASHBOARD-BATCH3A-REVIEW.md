# Dashboard settings and availability — Batch 3a

Implemented and verified, 8 September 2026. This is one reviewable family change within Batch 3; it does not close the entire dashboard review. Codex implements; Claude's independent review is pending. No commits, pushes, or publishing were performed.

## Changes to review

| Surface | Change | Purpose |
| --- | --- | --- |
| Settings | Readable labels, 16px labelled calendar/feedback fields, 44px controls, heading hierarchy | Make controls readable and usable on phones and with a keyboard |
| Email preference | Existing optimistic rollback plus a persistent error announcement | Explain why a failed change reverted |
| Calendar copy | Preserve the selectable field; announce copy failure and the manual fallback | Recover when clipboard access is denied |
| Feedback | Preserve category and exact draft on failure; disable pending edits; announce confirmed success and manage focus | Avoid losing words or focus; remove routine entrance fades |
| Google cards | Existing connection wording with danger-tone failures and readable native OAuth links | Clarify failures while retaining full browser navigation for OAuth |
| Weekly availability | Readable time ranges; 21 targets; disable overlapping saves and announce rollback | Prevent competing optimistic changes and explain failed saves |
| Pasted calendars | Labelled field, retained URL on failure, explicit refresh/disconnect errors, stale auto-check error clears on retry | Make errors recoverable without changing service contracts |

Existing card materials, copy, selection logic, and page widths remain. InstallAppCard's two typography changes also appear in its existing HomeSlot usage; installation behavior is unchanged. PushSettingsCard remains outside this batch. Navigation typography is also unchanged.

## Scope and evidence boundary

The settings and availability pages use their actual page JSX and presentation components in a local browser fixture. Server reads and writes are replaced by synthetic data and observable promises. The fixture never loads `.env.local`. HTTP mutations and external requests are blocked before navigation. Browser permission prompts and push registration are excluded explicitly; no real prayer, email, notification, Google connection, calendar, or emergency contact is exercised.

The Playwright MCP failed to initialize because its configured Chrome executable was absent. Verification uses the project's installed Playwright Chromium instead. No authenticated end-to-end, third-party Clerk popover, physical iOS PWA, or push delivery claim follows from these checks.

## Dashboard coverage ledger

| Route | Verification boundary | Remaining work |
| --- | --- | --- |
| `/dashboard` | Existing EventCard/RouteSkeleton and shared header fixtures | Full Home composition, live data, push prompts |
| `/dashboard/settings` | Batch 3a actual page with synthetic settings/actions; push card explicitly omitted | Real Clerk account/Google/OAuth/push/install flows |
| `/dashboard/availability` | Batch 3a actual page with synthetic weekly/calendar state | Live calendar sync, real authorization |
| `/dashboard/community` | Existing real CommunityWall fixture, four failure paths | Separate type/target migration and full page review |
| `/dashboard/e/[id]` | Existing EventCard fixture and RSVP rollback | Event detail, slots, rides, leader strip, full route |
| `/dashboard/e/[id]/edit` | Source inventory only | Form fixture and keyboard/error/target verification |
| `/dashboard/lead` | Source inventory only | Overview fixture and keyboard/target verification |
| `/dashboard/lead/group` | Source inventory only | Group tools, roster and actual Clerk integration |
| `/dashboard/lead/post` | Source inventory only | Posting form fixture and failure/target verification |
| `/dashboard/quiet` | Source inventory only; care explicitly excluded | Ordinary quiet UI, then separate safety/deletion review |
| `/dashboard/foundation` | Source inventory only; existing beliefs/Scripture page | Reading layout and links; Scripture gate applies |
| `/dashboard/today` | Source confirms legacy redirect to `/dashboard` | Browser redirect verification |

The detailed read-only inventory is `.claude/recon/verification/batch3-source-inventory.json`. Its literal classes are candidates for browser checking, not measured contrast or target failures.

## Frozen scope

No Scripture wording, attribution, corpus, tags, selection, calendar arithmetic, action contract, auth, roles, scheduling, notifications, privacy, API route, database, or care-card changes belong to this batch. The Scripture context gate remains closed. Before-state source copies and invariant hashes live in `.claude/recon/review-patches/batch3a/`.

## Validation

- **40 browser tests passed together**, no skipped/flaky tests. This includes 20 existing foundation/dashboard checks and 20 Batch 3 checks.
- **58 unit tests**, type check, table check, and production build passed. The scoped Impeccable detector returned `[]`.
- 47px simulated safe-area padding produces a 111px header with a separate 64px content row and visible title at 390 and 1280. No physical iOS test is claimed.
- Settings/availability families pass target, input-size and overflow checks at 390, 768, 1280, 1920, 320, 820, and 844×390 landscape. Settings also passes **200% CSS zoom of the content region**; this is not browser-toolbar zoom or OS text scaling.
- Native Tab traversal reaches all 15 settings and 26 expanded-availability controls with visible, settled gold outlines. No service action is activated during those walks.
- Eleven failure surfaces measure **7.36:1–8.20:1** against their actual browser-composited solid background stacks. Masks, images, opacity, filters and blending are rejected by that measurement method rather than silently omitted. These are scoped error measurements, not full-site contrast certification.
- Synthetic local and external POST probes are explicitly aborted by interception. Draft/retry/rollback, copy rejection, calendar failures, stale auto-check recovery, and feedback success focus pass.
- All **116 protected files remain byte-identical** to the captured pre-batch state, with no added/missing protected paths.

Before/after evidence uses one frozen capture script **and fixture instrument**, with 14 distinct shots per side at 390/1280. The fixture serves the exact Latin Inter/Cormorant font bytes from the existing local build; its manifest records checksums. Representative phone and desktop pairs received visual review; no automated pixel diff was run. Three after-only phone detail views show the whole weekly grid, feedback controls, and the settled keyboard focus ring.

| Measured state | Before targets below 44px | After |
| --- | --- | --- |
| Settings, 390 | 6 | 0 |
| Settings, 1280 | 7 | 0 |
| Availability with expanded calendar help, 390/1280 | 2 | 0 |
| Availability with connected calendars, 390/1280 | 2 | 0 |

All scoped family text clears the 13px floor; meaningful text is 14px or larger and native fields are 16px. The unchanged shell still has three 11px mobile tab labels and two small desktop brand labels. Those are recorded debt, not hidden by the family-level result.

## Reproduction and handoff

Start the synthetic fixture with `node scripts/serve-browser-fixture.mjs`, then run `node node_modules/@playwright/test/cli.js test --config=playwright.dashboard.config.ts`. Use the bundled Node 24.19 executable documented in `LOCAL-PREVIEW.md` on this host. This configuration never starts/stops the public preview. Cases: `/?case=settings&shell=1&route=/dashboard/settings` and `/?case=availability&shell=1&route=/dashboard/availability`; add `variant=connected`, `revoked`, or `stale` for synthetic states.

- Review patches and manifest: `.claude/recon/review-patches/batch3a/{04a-settings.patch,04b-availability.patch,manifest.json}`. Both patches pass reverse-application checks. They are slices relative to the pre-batch uncommitted source, not independently tested commits. Existing foundation dependencies are required.
- Comparison evidence: `.claude/recon/shots/dashboard-batch3a/{before,after}/measurements.json` plus the PNGs; frozen instrument at the parent directory.
- Detail evidence: `.claude/recon/shots/dashboard-batch3a/supplement/`, including font provenance.
- Tests: `.claude/recon/verification/batch3a-browser-result.json` and decoded attachments in `batch3a-browser-metrics.json`; final combined log is `batch3a-browser-final.log`.
- Build/unit/type/table/detector logs: `.claude/recon/verification/batch3a-{build,unit,types,tables}.log` and `batch3a-impeccable.json`.
- Independent source-only pass: `.claude/recon/verification/batch3a-source-review.md`. Both reported calendar issues were corrected before the final browser confirmation. This does not substitute for Claude's browser review.

Evidence history is retained: the first run found the narrow back link and a prayer-focus assumption; first inspection shots are under `inspection1`. A later test sampled `outline-color` before its existing 200ms transition settled. The test now waits for the target color; product CSS was not changed to satisfy it. That failed test log is retained as `batch3a-browser-focus-timing.log`.

## Next boundary

Claude reviews the two patches and evidence. Then continue with prayer-wall type/targets and its focus gap: a failed submission restores the exact draft but does not automatically return focus to the title. The final test records that limitation and verifies bounded Tab recovery; it does not claim automatic focus restoration. Leader/event/ordinary-quiet screens remain in the ledger above. Care-card/reflection-deletion work stays separate, and Scripture integration remains gated.
