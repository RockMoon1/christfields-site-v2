# Prayer wall — Batch 3b

9 September 2026. Codex implementation; Claude's independent review remains pending. This change covers only the community page and CommunityWall. It does not complete the dashboard migration. No commits, pushes, or publishing were performed.

## Changes to review

| Keep | Change | Remove |
| --- | --- | --- |
| Existing card materials, page width, headings and request copy | Visible form labels, 16px native fields, 14px actions/body/status and 13px attribution | Routine form, card, list and empty-state entrance animation |
| Existing optimistic updates and all four failure announcements | At least 44px controls using the existing Button with effects off | Tiny uppercase author actions and decorative card shimmer |
| Exact draft preservation, trim-on-send, temporary-card replacement | Conditional focus recovery after asynchronous results | Placeholder-only field naming |
| Empty/answered wording and current delete rollback ordering | Focus-within card border and wrapping for long unbroken text | Motion wrappers that could delay restored form focus |

The existing empty-state material remains deliberately quieter than a populated card. The form uses the existing Field error slots; no shared primitive was widened. Remove uses the established danger treatment. This change does not introduce a prayer deletion confirmation flow. Reflection deletion and the care card remain their own review boundary.

## Focus behavior

Both Share actions focus the title. Cancel restores the particular opener and retains the draft. Activating the empty-state Share action while its form is already open also returns to the title.

After asynchronous work, focus moves only if no meaningful element currently holds it. Moving to another control while a request is pending takes precedence over recovery.

| Action | Failure destination | Success destination |
| --- | --- | --- |
| Post | Restored title with exact draft | Confirmed new card heading |
| Pray | Restored Pray button and original count | Card heading; already-prayed action remains disabled |
| Mark answered | Restored Mark answered button | Remaining Remove action |
| Remove | Restored card's Remove action | Next card heading, otherwise previous heading, otherwise top Share action |

Programmatically focused headings do not add Tab stops. The existing delete failure still prepends the restored card. No ordering rewrite or state-management replacement is included.

## Evidence boundary

The synthetic fixture renders the actual async community page JSX and actual CommunityWall, optionally inside the actual dashboard navigation/header presentation. Reads and writes are replaced before loading with synthetic records and observable promises. It never loads `.env.local`; browser tests block external requests and all HTTP mutations. No real prayers, notifications, emergency contacts, accounts, or member records are used.

The Playwright MCP could not launch its configured Chrome executable. Verification uses the installed Playwright Chromium. This is not authenticated end-to-end evidence, RSC transport verification, third-party Clerk verification, or a physical iOS PWA test. The standalone production build is a separate gate.

## Validation and comparison

The final combined browser run passed **all 51 tests**, including 11 prayer-wall cases and the previous 40 dashboard/foundation checks. No tests were skipped and no automatic retries were used. The initial 49-test run is retained separately.

- The community family passes text/input/target and overflow checks at 390, 768, 1280, 1920, 320, 820 and 844×390 landscape. A separate 200% CSS-zoom check covers the enlarged family and keyboard cancellation; it does not claim browser-toolbar zoom, OS text scaling or physical-device coverage.
- Native Tab traversal reaches every enabled wall control: four with the form closed and seven with it open, at both 390 and 1280. Each stop has the settled gold outline and readable focused text.
- Browser-composited text contrast has a **5.03:1 minimum** across populated, answered, form, placeholder, pending, failure, empty and focused states. The method resolves actual foreground and ancestor solid backgrounds, including alpha. Unsupported masks, images, filters, group opacity, blending and generated paint fail explicitly. Disabled controls are recorded as exempt. This is scoped rendered-style text contrast, not screenshot pixel analysis or a non-text-border audit.
- Normal and reduced-motion observations begin before component scripts and verify immediate meaningful form, card, restored and empty-state content. Brief color feedback remains.

Type check, 58 unit tests, table check, production build and scoped whitespace check pass. The two-file Impeccable detector returned `[]`; this static detector result is not an accessibility certification. A separate source review found no actionable regression. All 123 protected files remain byte-identical: 116 contract/Scripture/safety paths plus seven prior Batch 3a files, with no added or missing protected paths.

Eight distinct before screenshots and eight distinct after screenshots use one frozen capture script and fixture instrument. Both sides use the same fixed clock and the exact local-build Latin Inter/Cormorant font bytes. At 390×844 and 1280×900, the set covers populated wall, author actions, open form and empty state. The instrument, source, screenshot and font hashes are recorded. Representative phone and desktop pairs received visual inspection; no automated pixel diff is claimed.

| Captured family state | Before targets below 44px | After | Before text below 13px | After |
| --- | --- | --- | --- | --- |
| Populated wall / author actions, both widths | 4 | 0 | 16 | 0 |
| Open form, both widths | 7 | 0 | 20 | 0 |
| Empty wall, both widths | 0 | 0 | 1 | 0 |

These counts cover the community family. The unchanged shell's small tab/brand labels remain separate debt. Capture measurements inspect the whole rendered family, including content below the viewport; each screenshot represents its recorded scroll position.

## Reproduction and handoff

Start the fixture with `node scripts/serve-browser-fixture.mjs`. Open `http://127.0.0.1:3100/?case=community-page&shell=1&route=/dashboard/community`; add `variant=empty` for the empty wall. The old `case=community` fixture remains available for earlier component tests. Use the bundled Node 24.19 path in [LOCAL-PREVIEW.md](LOCAL-PREVIEW.md) on this host.

Run `node node_modules/@playwright/test/cli.js test --config=playwright.dashboard.config.ts`. This configuration never starts or stops the public preview. The public production preview has been rebuilt and restarted separately at `http://127.0.0.1:3000/`.

- Review slice: `.claude/recon/review-patches/batch3b/04c-prayer-wall.patch` and `manifest.json`. Reverse-application check passes. This is relative to the captured pre-batch uncommitted source, with existing shared foundations required; it is not an independently tested commit.
- Before/after screenshots and measurements: `.claude/recon/shots/prayer-wall/{before,after}/`.
- Frozen capture and fixture instrument: `.claude/recon/shots/prayer-wall/{capture.frozen.mjs,instrument.json}`.
- Capture/packaging scripts: `scripts/capture-prayer-wall.mjs` and `scripts/package-prayer-wall.mjs`.
- Browser tests: `tests/browser/prayer-wall.pw.ts`, plus the previous prayer failure test now requiring automatic focus recovery.
- Build/unit/type/table/detector logs: `.claude/recon/verification/prayer-wall-{build,unit,types,tables}.log` and `prayer-wall-impeccable.json`.
- Initial 49-test run: `.claude/recon/verification/prayer-wall-browser.log`.
- Final 51-test run: `.claude/recon/verification/prayer-wall-browser-final.log`, `prayer-wall-browser-result.json`, and decoded attachments in `prayer-wall-browser-metrics.json`.

Evidence history: the expanded suite initially passed 50/51. Its keyboard helper tried to focus/activate the next control after the fixture promise ledger cleared but before React committed the enabled state. The helper now waits for enabled state and verifies actual focus before Enter; product code was not changed for that failure. The failing run remains in `prayer-wall-browser-readiness.{log,json}`. The subsequent complete 51-test run passed.

## Remaining boundaries

Claude should review this two-file slice and the browser evidence. Event details/slots, leader tools, ordinary quiet UI, push/install behavior, navigation typography and authenticated integration still need their own passes. Care-card/reflection-deletion adoption remains separate. No Scripture wording, attribution, context display, corpus, tags, order, selection or calendar arithmetic changed; the incomplete Scripture contextual review still gates Stage 5.
