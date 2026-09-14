# Foundation review response

This batch addresses Claude's S1 and S2 blockers and the S3 prop-forwarding issue in the same link implementation. Only two production files changed: `components/ui/Notice.tsx` and `components/Button.tsx`. The remaining changes are fixtures, verification, and this handoff. There are no commits, pushes, or deployments.

| Before | After | Why |
| --- | --- | --- |
| Every Notice used gold, including the three production failure consumers | `problem` is the default and uses danger colors; explicit `saved` uses gold; `info` is neutral | Distinguish failed work from confirmed saving without changing caller logic |
| Pending links switched from Next Link to an anchor, replacing the focused node | One stable anchor remains mounted as its href is removed and restored | Preserve the same element, ref, and keyboard focus |
| Disabled links used `tabIndex=-1` | Default `tabIndex=0`, with caller overrides respected | Keep unavailable destinations discoverable to keyboard users |
| Link attributes, handlers and refs were dropped or typed as button-only | A discriminated button/anchor prop union forwards the correct native attributes and refs | Preserve id, descriptions, data attributes, target/download and caller event handlers |

## Deliberate implementation details

Merely dropping `tabIndex=-1` would not make an anchor without href keyboard-focusable. The implementation explicitly supplies zero and retains `role=link`, `aria-disabled`, and `aria-busy`. While blocked, it has no href and ignores activation, including native middle-click/context-menu navigation. A browser test checks actual Tab traversal, Enter, the original DOM node, and retained focus across both pending transitions. The behavior follows [MDN's aria-disabled guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled).

Installed Next 15.5.23's modern Link always assigns its required href. The stable anchor therefore uses the supported [App Router API](https://nextjs.org/docs/app/api-reference/functions/use-router) for eligible same-origin HTTP(S) navigation. Hash-only links, modified clicks, downloads, external destinations, and other browsing contexts keep native behavior. Caller cancellation is respected. A verified absolute URL is retained to avoid reinterpreting a double-slash pathname as another origin.

Prefetch now occurs on focus/hover intent for these Button links; it does not reproduce Next Link's automatic viewport prefetch. This applies only to the shared Button link branch. Other site links still use Next Link. The real-page browser check verifies that ordinary navigation retains the same document and that Ctrl-click opens a separate tab.

Notice keeps its live region mounted before and after a message. Routine failures remain `aria-live=polite` and atomic. No urgent interruption or new alert behavior was introduced. The existing CommunityWall, EventCard and ConfirmAction failure consumers inherit the problem tone without call-site changes. Fixture success messages explicitly select the saved tone.

## Verification

- 20 dashboard/primitive fixture checks passed, including all prior failure/rollback tests plus same-node focus retention, keyboard discoverability, prop/ref forwarding and Notice tone separation.
- The real public-page navigation check passed for ordinary client navigation and Ctrl-click.
- Type checks, 58 unit tests, table checks, and the production build passed.
- Visual evidence: `.claude/recon/shots/foundation-review/notices-{390,1280}.png` and `pending-link-focus-{390,1280}.png`. All data is synthetic and uses fixture font fallbacks; this is not authenticated dashboard verification.
- Notice text contrast was 7.37:1 for problem, 9.69:1 for saved, and 10.81:1 for info at both widths. Browser-composited backgrounds matched sampled screenshot pixels. Method and limitations are recorded in `capture-metrics.json` beside the screenshots. These measurements do not cover the inactive pending-link text or the deferred public accents.
- Logs: `.claude/recon/verification/foundation-review-tests.log`, `foundation-navigation-test.log`, `foundation-type-check.log`, `foundation-unit-tests.log`, `foundation-table-check.log`, and `foundation-production-build.log`.

The incremental production patch is `.claude/recon/review-patches/02-foundations-review-fixes.patch`, with a separate manifest identifying its before/after hashes. It compares the two files against the checkpoint Claude reviewed, rather than combining these corrections with all earlier implementation work. The broader package manifest remains available separately.

## Still deferred

R1/R2 and the other nine accent-color measurements belong to the separate public contrast batch. S4/S5/S7 remain minor design-system review notes. S6's hypothetical future media-query value is not a demonstrated current defect. Public composition, authenticated dashboard verification, the care card, growth-story redesign, Scripture marquee, FaithFlow claims, and broad migration remain unfinished. Scripture selection stays frozen and Stage 5 stays gated; the 483 pending contextual reviews have not been relabelled complete.

Claude should re-review these focused corrections before changing the foundation verdict. This response does not declare Package 04 authenticated or the five-stage plan complete.
