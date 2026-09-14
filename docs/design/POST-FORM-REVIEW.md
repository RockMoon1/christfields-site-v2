# Leader posting forms — review handoff

14 September 2026. This uncommitted batch changes only
`components/lead/PostForm.tsx` and `components/lead/WhoIsFree.tsx` in production.
Baseline: `f06d52f627ed64d7e51f441b12a0b5df6f2420d3`. The preceding member-event
and LeaderStrip batches still match their captured source hashes. All three
batches remain local and unpublished.

## Keep / change / remove

| Kept | Changed | Removed |
| --- | --- | --- |
| Brand, field wording, kind choices, note defaults and touched-note policy | Readable 14px labels/actions, 13px metadata, shared 16px inputs, 44px targets | 10–11px labels/actions and nested optional-section boxes |
| Create/edit payloads, repeat scope, notify choices, rides and bring-list parsing | Synchronous submit guard and a disabled fieldset while saving | Overlapping submissions and editable values during an in-flight save |
| Exact draft values on failure | Persistent, associated validation messages; invalid hidden fields reopen and receive focus | Unannounced errors and malformed/end-before-start date submission |
| Availability calculation and best-time selection | Request cleanup, immediate hiding of mismatched group data, explicit loading/failure/retry | Stale group results and A→B→A response overwrites |
| Existing Scripture helpers and leader-entered wording | Truthful More/Word disclosure state | A Word toggle claiming to be expanded while More hid it |

The form uses simple section rules for optional material and extends the existing
Button with `fx={false}`. Routine content has no entrance animation. Availability
failure never blocks saving. Returned save errors and thrown transport failures
retain entries and ask the leader to check the gathering before retrying; they do
not assert that no write happened. Raw transport exception details are not shown.

## Verification

- **102/102 combined dashboard browser tests pass in one final run**, including
  20 new form checks and the preceding 82. Logs:
  `.claude/recon/verification/post-form-browser.{log,json}`.
- All 58 unit tests, TypeScript, table checks and production build pass. Logs:
  `.claude/recon/verification/post-form-{unit,types,tables,build}.log`.
  The local production preview was restarted from that build.
- OMC execution kept fixture/test authors separate from production implementation.
  Independent OMC review found one new retry-focus defect. A focused correction
  and independent Chromium reproduction confirmed success focuses When, another
  failure restores Try again, and deliberate focus elsewhere survives either
  response. No remaining findings in that scoped review. Claude's independent
  review is still a separate handoff.
- Eight distinct before/after screenshot pairs at 390 and 1280 live under
  `.claude/recon/shots/post-form/{before,after}`. The capture script and complete
  fixture/server instrument have identical hashes in both phases. Final captures
  match current production sources. Desktop and phone captures were visually
  inspected; no automated pixel-diff claim is made.
  Final captures followed trailing-whitespace cleanup; no runtime code changed
  after the passing combined test/build run.
- Final capture measurements show zero form-family text below 13px and zero
  targets below 44×44. Native checkbox labels count as their click targets.
  Tests check 16px labelled fields, dark native controls, keyboard paths,
  disclosure state, exact payload/draft values, pending guards, save failure,
  availability retries/races and immediate normal-motion content.
- Composited error-surface contrast passes at 390/1280. This is browser-resolved
  solid-color alpha compositing, not screenshot pixel analysis or a full-site
  contrast certification.
- Long content reflows at 320 and 640 CSS pixels. The latter is the responsive
  width of a 1280-pixel window at 200% browser zoom; actual browser UI zoom was
  not exercised. An initial CSS-zoom proxy retained desktop media queries and
  produced an artificial narrow five-column layout; it was replaced with this
  explicitly labelled equivalent-width check. Another initial test failure
  incorrectly counted the screen-reader-only legend as clipped visible text.
  Neither was treated as a production defect. Final tests have no failures/skips.

Review patch: `.claude/recon/review-patches/post-form.patch` (reverse-checked).
`post-form-boundary.json` records preserved earlier sources, unchanged backend
and Scripture files, and eight unique final captures. Fieldset indentation makes
the raw patch larger; `git diff -w -- components/lead/PostForm.tsx` helps isolate
the behavioral and class changes.

## Existing limitations, reserved for separate changes

1. Create/update may write before notification/calendar work fails. The UI cannot
   infer rollback from a failed result and does not automatically retry.
2. Bring-slot insertion during create and follower updates during series editing
   currently do not inspect all returned write errors. Success is not proof that
   every related write succeeded. Backend transactions/results are unchanged.
3. The create page's existing Extend prefill advances the start by seven days but
   retains the old end. The new end-after-start validation exposes that stale
   value and asks the leader to correct it; it does not silently change dates.
   Fix the page prefill in a separate page-shell batch with its own regression.
4. Availability is built in Denver while the form compares browser-local time.
   This batch tests in America/Denver and makes no claim for other time zones.
5. The existing best-time button disappears once its time is selected. Its focus
   behavior is unchanged; independent review identified it as a separate
   pre-existing follow-up, not the new retry-control defect fixed here.

Production create/edit page headings, navigation and server-loaded props were
not migrated in this batch. No Scripture quotation, attribution, reference
helper, selection input or leader-only data contract changed.

## Fixture boundary and remaining work

Preview: `http://127.0.0.1:3100/post.html?form=create&shell=1`.
`form=edit|series`, `variant=long|empty|multigroup`, manual response settlement,
transport failures and partial-write indicators use synthetic data only.
The actual PostForm and WhoIsFree render inside an optional dashboard shell;
the surrounding fixture heading is illustrative, not a migrated page heading.
Navigation is recorded as intent, not real Next.js navigation. Tests block
external requests and HTTP mutations. No event, prayer, notification, account,
credential or real member record is used.

Authentication, RSC, actual database writes, service delivery, physical-device
date pickers and browser UI zoom remain unverified. Fixture action/navigation
wrappers delegate the earlier fixtures unchanged; the full regression suite
passes. New tooling consists of a separate post entry, its actions/navigation,
capture script and 20-test spec.

Remaining work includes leader page shells/prefill, the separate care/deletion
review and gated Scripture context work. No commit, push or deployment was
performed for this batch.
