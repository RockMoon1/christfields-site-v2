# Public contrast review — Package 03c

Claude's completed independent review marks this package **Ready**. It reproduced the rendered mask mechanism and the after-values on desktop and phone. Its real mouse click also verified the Button's client navigation; this does not imply independent reproduction of every modified-click or pending-state fixture.

This is the next small batch after Claude marked the foundation fixes Ready. It changes only `components/sections/PracticesScroll.tsx` and `components/sections/DayScroll.tsx`: 15 added lines and 8 removed lines. Verification and local preview support are packaged separately. No commits, pushes, or deployments.

## Change and reason

| Before | After | Why |
| --- | --- | --- |
| Practice references at 10px; time labels at 11px | Shared `text-meta`, measured 13px | Apply the agreed attribution/eyebrow floor |
| “Scroll →” instruction at 11px | `text-sm`, measured 14px | Make the instruction readable |
| Honesty, Midday and Night used dark decorative colors for text | Separate brighter text colors; stripes, dots and halos keep their existing colors | Three foregrounds failed the 4.5:1 threshold |
| The rail's 6% edge fade reached settled text on desktop | Fade ends within the 24px gutter | Even the otherwise-passing Presence gold was faded below the threshold |

Honesty reuses the existing `--color-emerald-bright`. Midday uses `#bf7581` and Night `#927fb9` for labels only. Other label foregrounds stay unchanged. Copy, references, verse data, selection, motion behavior, card composition, and section spacing are unchanged in this batch.

## All 11 accent uses measured

There are 11 uses of eight original colors, not 11 distinct colors. Each was measured on the actual local Next page with its Inter fonts loaded. Numbers below are the conservative minimum contrast across the text-range rectangle, rounded to two decimals. The intended threshold for every label here is 4.5:1.

| Label | Before 390 | Before 1280 | After 390 | After 1280 |
| --- | ---: | ---: | ---: | ---: |
| Presence / Hebrews 10:25 | 8.13 | 2.29 | 8.13 | 8.13 |
| Honesty / Psalm 51:6 | 2.98 | 1.42 | 6.87 | 6.87 |
| Scripture / Psalm 119:105 | 11.74 | 11.74 | 11.74 | 11.74 |
| Prayer / Philippians 4:6 | 5.40 | 5.40 | 5.40 | 5.40 |
| Sharpening / Proverbs 27:17 | 5.67 | 5.67 | 5.67 | 5.67 |
| Morning | 11.95 | 12.02 | 11.95 | 12.02 |
| Midmorning | 5.53 | 5.53 | 5.49 | 5.53 |
| Midday | 3.36 | 3.36 | 5.69 | 5.71 |
| Afternoon | 5.88 | 5.88 | 5.87 | 5.88 |
| Evening | 8.08 | 8.08 | 8.08 | 8.08 |
| Night | 4.34 | 4.34 | 5.67 | 5.67 |

The scroll instruction measures 5.69:1 at both widths. All 22 accent measurements and both instruction measurements pass after the change; their minimum is 5.396:1. Small ratio changes in unchanged time colors come from the gradient beneath the resized text area.

The first desktop practice card settles at native rail position 28px. Before, inherited mask coverage fell to 0.424 within its text range. After, coverage is 1 throughout every measured label. This is why checking the bare color against a CSS background token would have missed part of the defect.

## Evidence and limits

**Correction following independent review:** the original before and after captures did not use an identical script version. The later run added an explicit `interLoaded` check (24 entries after, none before); the earlier metadata recorded font-family and general font-load state. The initial script bytes were not hashed, so exact instrument equivalence cannot be established retrospectively. Do not describe these columns as captures from one frozen instrument. Claude independently reproduced the after-values and the old/new mask mechanism.

Also, `1280-practice-3.png`, `1280-practice-4.png`, and `1280-practice-5.png` are byte-identical within each phase: the rail has reached the same end position with those targets in view. There are five named target captures but only three distinct desktop practice frames, not five independent visual views. Each label still has its own measurement record. The historical images and JSON remain unchanged; later capture tooling records script hashes and duplicate groups explicitly.

- Before and after: `.claude/recon/shots/public-contrast/{before,after}/`, each containing 24 screenshots and `measurements.json`.
- Compare `1280-practice-1.png` for the rail fade, `390-practice-2.png` for the Honesty reference, and `390-day-3.png` / `1280-day-6.png` for the time labels. Matching filenames exist in both directories. These pairs were visually inspected; no automated image-diff claim is made.
- `scripts/capture-public-contrast.mjs` loads the real page, scrolls each label into view, waits for settled reduced-motion rendering, and samples its rendered background. Temporary black/white calibration on that label measures inherited mask/opacity coverage; styles are restored immediately. The text's actual DOM Range bounds are used instead of the whole paragraph's unused width.
- Measurement uses 8-bit browser screenshots and intended opaque foreground color, excluding antialiased glyph edges. It conservatively samples inter-character space too. It does not certify every entrance-animation state, spotlight hover position, browser engine, physical device, or dashboard surface.
- All measured labels fit within the viewports, no horizontal page overflow was observed at 390/1280, and no page exceptions were recorded. Browser requests that could submit data were intercepted before navigation.
- Forty-four additional label layout checks passed at 320, 768, 1920 and 640 CSS pixels / DPR 2. The last approximates the reflow space of a 1280px screen at 200% zoom; it is not an actual browser zoom test. Results and eight screenshots are recorded in `after/spotcheck-layout.json` and its neighboring files.
- The existing Next development issue badge appears in before and after captures. The zero-exception result is not a claim that console warnings or development diagnostics were audited.

Type checks, all 58 unit tests, table checks, and the production build passed. The actual-page navigation check passed against both the development and final production previews. Logs are in `.claude/recon/verification/public-contrast-{type-check,unit-tests,table-check,production-build}.log`, `navigation-followup.log`, and `navigation-production-followup.log`.

The production diff is packaged independently as `.claude/recon/review-patches/03c-public-contrast.patch`. Its baseline and checksum are in the package manifest. Shared tooling and reports remain in Package 00; this is not a commit or an independent checkout.

## Foundation and preview follow-up

Claude's verdict for Package 02 is Ready. Its completed browser review reproduced ordinary client navigation with a real mouse click and a retained page marker. Codex's actual-page test also covers Ctrl-click to a new tab and Enter activation; those and the pending-state fixture should still be distinguished from Claude's independent reproduction. There are 14 production Button source callsites with href and none with href plus pending. Repeated intent-prefetch calls and the documented framework-navigation tradeoff remain visible review notes, not newly claimed defects.

See [Local preview lifecycle](LOCAL-PREVIEW.md) for the separate launcher, logs, process identity checks, and diagnosis limits. The old execution returned exit code 1 with no diagnostic output; the logs do not establish why it stopped. The new launch was verified to survive its initiating shell's exit. Future process lifetime is not guaranteed, and the helper does not conceal failures with automatic restarts.

The growth-story composition, FaithFlow illustration/claims, authenticated dashboard review, isolated care-card work, and broader migration remain pending. Stage 5 remains gated with 483 contextual reviews outstanding.
