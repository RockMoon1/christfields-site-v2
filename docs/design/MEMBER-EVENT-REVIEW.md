# Member event page — implementation and review

14 September 2026. Baseline: `f06d52f627ed64d7e51f441b12a0b5df6f2420d3`.
This is a separate, uncommitted member-event batch. The earlier release remains
published; this change has not been committed or pushed.

## What changed

The event's Cormorant heading, type accent, faces, personal date/location and
quiet conversation prompts remain. Supporting labels now meet the 13px floor;
actions and meaningful supporting text use at least 14px. Long names, locations
and bring-list descriptions wrap; phone slot actions sit below their description.
The outing chip has a lighter local foreground against its tinted fill. Cancelled
events use the semantic danger badge without dimming the whole card.

RSVP still restores both the previous answer and faces on failure. A confirmed
answer moves unclaimed focus to its confirmation; changing an answer restores
the selected choice. Native calendar links and their destinations are preserved.

Planning saves are serialized and restore the exact previous choice on failure.
Ride offers keep the origin and selected seats after returned or thrown failures;
only confirmed success closes and clears the form. The ride form has a visible
label, pressed seat choices, disabled pending controls and conditional focus
recovery. Slot failures are announced. Their existing refresh-on-failure behavior
remains useful when capacity changed concurrently.

The only production files changed are EventCard, GoingFaces, AddToCalendar,
PlanQuestion, SlotList, Starters and the event page's Home-link classes. Shared
primitives, services, event themes, Scripture and leader tools are unchanged.

## OMC workflow used

The installed `execute` workflow split RSVP/calendar and planning/slots into
explicit file ownership. `verify` supplied a separate test author. An independent
`omc-review` context read the seven production files and reproduced keyboard,
rollback, long-content and focus behavior in Chromium. It reported no verified
defects. Impeccable was the primary product-design skill, with DESIGN.md controlling
the identity. No new orchestration dependency or blanket skill installation was
needed. Claude's independent review remains a separate handoff.

## Evidence

- Production build, TypeScript, table check and all 58 unit tests pass.
- One final combined dashboard browser run passes **66/66**: 51 existing checks
  plus 15 member-event checks. Log and JSON results are in
  `.claude/recon/verification/member-event-browser.{log,json}`.
- New checks cover returned failures and transport rejection for planning, rides
  and slots; exact drafts and rollback; success refresh; keyboard focus and
  deliberate focus elsewhere; existing member/later/cancelled page gates;
  labelled 16px inputs; 44px targets; all five chip contrasts; and immediate
  routine content under normal motion.
- 390px and 1280px screenshots were inspected together. A 320px long-content
  check also passes. Eight distinct before/after frames per side are stored in
  `.claude/recon/shots/member-event/{before,after}`. The capture script and all
  fixture/server files have one frozen instrument. Source copies and checksums
  are retained. A final capture follows a source-formatting-only change.
- No measured event-family text is below 13px and no measured event-family
  control is below 44×44 in the final screenshots. These checks exclude the
  deliberately absent Scripture and leader panels.
- Outing's old browser-resolved foreground/fill combination was approximately
  4.42:1. Its revised combination exceeds 5.3:1. All five chip checks pass.
  The method composites browser-resolved solid colors and rejects unsupported
  masks, filters and opacity; it is not automated screenshot pixel comparison.

The initial regression run had two transient failures during an active fixture
session; one recorded an unexpected page reload. Both passed a focused recheck,
and the final stable 66-test run passed. No source correction was needed for either.
The new tests also needed corrections to scoped selectors and the pending button
label before that final run. These were test-harness corrections, not product fixes.

## Limits and next batch

The fixture renders actual event-page JSX with synthetic actions and data. It
rereads synthetic data on refresh; this does not verify real RSC transport,
authentication/authorization, notification delivery or calendar downloads. All
external requests and HTTP mutations are blocked. No real member action was sent.
The existing RSVP mock returns failures and does not update the server-page data
record; RSVP transport rejection and newly answered server-page gates are not
established by this fixture. Source handling and initial gate scenarios were checked.

The final build runs locally on port 3000. A clearly labelled synthetic event
preview is available at `http://127.0.0.1:3100/?case=event-page&shell=1&variant=answered`.
This batch does not constitute a full-site accessibility certification or a
physical-device/PWA check. Leader tools are next; care and Scripture remain their
own gated changes. No database, API, auth, notification, scheduling or privacy
contract changed.
