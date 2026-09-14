# Event and leader UI release — 14 September 2026

The founder explicitly authorized committing and pushing the three completed
post-release UI batches. This checkpoint follows `f06d52f` and is separate from
the earlier design release on the same day.

## Included work

1. Member event: readable RSVP/calendar/planning/bring/ride controls, precise
   rollback, preserved drafts and conditional keyboard focus. Seven production
   files; see [member-event handoff](MEMBER-EVENT-REVIEW.md).
2. Leader event controls: readable roster/actions, serialized writes, explicit
   failure messages, clipboard fallback and refreshed attendance. One production
   file; see [leader-event handoff](LEADER-EVENT-REVIEW.md).
3. Leader posting forms: readable controls, associated validation, guarded saves,
   truthful disclosures and availability request/retry handling. Two production
   files; see [posting-form handoff](POST-FORM-REVIEW.md).
4. Shared synthetic fixture adapters, three new test/capture families and review
   documentation. The production changes are separate commits, followed by this
   combined verification package. Verification covers the final combined tree;
   intermediate commits were not each independently tested.

Earlier handoffs retain their historical uncommitted status and known limits.
This release note records the subsequent authorization. The broader design and
Scripture plan remains incomplete.

## Verification carried into release

- All ten production files match their final captured source hashes. The final
  posting capture instrument, including all fixture/server files, also matches.
- The final combined run passed **102/102 dashboard browser checks**, with zero
  failures, skipped checks or flaky results. All **58 unit tests**, TypeScript,
  table checks and the production build passed. The only subsequent production
  edit removed trailing whitespace; captures were refreshed after that cleanup.
- Each batch has eight distinct desktop/mobile before/after screenshot pairs.
  Local logs and captures remain in ignored `.claude/recon/` paths named in the
  handoffs. The release source/evidence check is recorded at
  `.claude/recon/verification/release-event-leader-20260914.json`.
- Independent OMC release review confirmed the exact production scope and
  required fixture dependencies. No backend, API, DB, auth, notification,
  scheduling, Scripture, privacy, shared primitive or dependency change appears
  in this release.

Browser evidence is synthetic and does not certify authenticated services,
database writes, notification delivery, RSC transport, physical-device behavior
or actual browser UI zoom. Existing partial-write limitations and the recurring
event Extend prefill issue remain explicitly recorded in the handoffs.

## Delivery

Push to the existing `main` branch on GitHub; Netlify handles deployment through
the existing integration. No manual deployment, configuration or environment
change is included. Local verification and a successful push do not by themselves
prove the Netlify deployment has finished.

Stage only the release's explicit paths. Exclude `.agents/`, `.omc/`, the existing
untracked `AGENTS.md`, the unrelated study-desk prompt, local evidence/runtime,
secrets and private documents.

Remaining work: leader page layouts and Extend prefill, the separate care and
deletion review, gated Scripture context integration and authenticated checks.
