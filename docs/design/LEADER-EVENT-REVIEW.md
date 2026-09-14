# Leader event controls — review handoff

14 September 2026. This separate, uncommitted UI batch changes only
`components/lead/LeaderStrip.tsx` in production. Its baseline is the version at
`f06d52f627ed64d7e51f441b12a0b5df6f2420d3`. The seven member-event files from the
preceding batch still match their recorded checksums. Neither batch has been
committed or published.

## Keep / change / remove

| Kept | Changed | Removed |
| --- | --- | --- |
| Brand palette, Cormorant heading, named roster, first-time welcome and existing copy | Clear section hierarchy; 13px section labels, 14px meaningful text/actions, labelled 16px inputs and 44px targets | Tiny action labels and raw red cancellation classes |
| Existing services, visibility gates, leader-only context and cancellation confirmation | Shared buttons/fields/notices, serialized writes, exact attendance rollback and conditional focus | Silent errors and closing a failed cancellation form |
| Nudge delivery counts, once-only limit, chat share text | Persistent result announcements and a selectable clipboard fallback | Dependence on clipboard permission for access to share text |
| Attendance read from the server | Synchronization when refreshed roster props arrive | Treating a bulk action's boolean as evidence that attendance was written |

Failed thanks and cancellation preserve the exact draft and say completion could
not be confirmed. Only a confirmed action result closes the cancellation form.
Keyboard focus follows an inline form opening/dismissal or a removed action;
delayed responses do not take focus from another control. Notes use simple
section rules rather than several nested bordered boxes. No entrance motion was
added.

## Verification

- **82/82 combined dashboard browser tests pass in one final run**: the previous
  66 plus 16 leader checks. Output:
  `.claude/recon/verification/leader-event-browser.{log,json}`.
- All 58 unit tests, TypeScript, table checks and production build pass. Logs:
  `.claude/recon/verification/leader-event-{unit,types,tables,build}.log`.
- OMC `execute` separated fixture/test work from the production author. A separate
  `omc-review` context inspected the implementation and reproduced keyboard
  submission, preserved drafts, retry focus and absence of browser exceptions.
  It reported no verified production defects. Impeccable and DESIGN.md supplied
  the product-design standard. Claude review remains a separate handoff.
- Eight distinct screenshot pairs at 390 and 1280 are in
  `.claude/recon/shots/leader-event/{before,after}`. The script, server and fixture
  hashes are frozen across each pair. Desktop/mobile were inspected together;
  confirmation captures followed removal of a trailing blank line, with no
  runtime changes. No image-diff claim is made.
- Final captures report zero leader-family text below 13px and zero targets below
  44×44. Browser tests also check labelled 16px fields, long-content wrapping at
  320px, a clearly labelled 200% CSS-zoom reflow proxy, normal-motion immediate
  visibility, keyboard focus, and composited contrast of the cancellation/error
  surfaces. This is scoped evidence, not a full-site accessibility certification.
- Initial test-author runs needed scoped-locator corrections; no product fix was
  required by those failures. The final combined run has zero failures/skips.

The source review patch is
`.claude/recon/review-patches/leader-event.patch`. Tooling is a separate new
`leader.html` entry, `leader-main.tsx`, `leader-actions.ts`, capture script and
test spec; the existing fixture server changes one lead-action alias. Older
member fixture files are unchanged in this batch. Their earlier frozen captures
remain historical evidence; new leader captures use their own instrument.

## Service limitations discovered and retained

1. `cancelEvent` and `postThanks` can write successfully before notification or
   calendar work throws. Therefore `{ok:false}` does not prove nothing happened.
   The UI preserves the draft and asks the leader to check the event before
   retrying; it never asserts the event is still scheduled or nothing was posted.
2. `markEveryoneCame` currently does not inspect returned Supabase upsert errors.
   An `{ok:true}` response therefore does not prove all attendance writes succeeded.
   This UI rereads attendance and displays those records, with a request to check
   the names. The `bulk=no-change` fixture test proves it does not invent checked
   names when the service returns success without changing the records.

These are existing backend limitations, recorded for a separate service change.
No backend, database, API, auth, notification, scheduling, Scripture or privacy
contract was altered here. The leader-only context never enters member data.

## Fixture boundary and next work

Preview: `http://127.0.0.1:3100/leader.html?variant=started&shell=1`.
The real LeaderStrip renders with synthetic data/actions and a synthetic refresh.
All external requests and HTTP mutations are blocked in the tests. No real
attendance, notifications, cancellation, thanks or member information was used.
Authentication, RSC transport, actual database writes, notification delivery,
device clipboard permissions and physical-device behavior remain unverified.

The member-event batch remains intact. Remaining leader forms, the separately
reviewed care/deletion work and the gated Scripture context review are still open.
Commit/push requires a new explicit request; publishing remains GitHub → Netlify.
