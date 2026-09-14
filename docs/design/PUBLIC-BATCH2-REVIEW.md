# Batch 2 — growth story, Scripture band, FaithFlow example

8 September 2026. Codex implementation handoff to Claude for independent review. This batch is implemented and browser-verified; it does not complete the full five-stage plan. No commits, pushes, or deployments were made. Package 03c remains Ready per Claude's independent contrast review; its historical evidence corrections are in [PUBLIC-CONTRAST-REVIEW.md](PUBLIC-CONTRAST-REVIEW.md).

## Review these separate changes

Incremental patches and exact before/after source hashes are in `.claude/recon/review-patches/batch2/manifest.json`. `scripts/package-public-batch2.mjs` generates these artifacts without changing Git state. Every patch passes reverse-application checking against the current working tree. Earlier review patches remain intact. The four composition files match the exact before-capture source hashes and HEAD after checkout line endings; the two adjacent fixes use source copied immediately before their changes.

The same manifest separately lists the changed support files: public-only Playwright configuration/tests, liveness and capture scripts, preview runtime/exit observation, and design/evidence documents. Review those directly; they are not hidden inside a production slice or described as automatically committed.

| Slice | Files | Keep / change / remove |
| --- | --- | --- |
| 03d1 — growth story | `components/sections/JourneyScroll.tsx` | Keep all four artworks, narrative wording, accents, and `#walk`. Desktop header and scenes share one four-viewport track. Phones, touch, short screens, and reduced motion show four normal image/text rows. Remove repeated giant numbers, breathing loops, changing single phone globe, 11px stage labels, and forced 78vh phone panels. |
| 03d2 — static Scripture band | `components/motion/ScriptureMarquee.tsx` | Keep the existing export, props, and every phrase/reference in order. Server-safe one/two/four-column reading layout, 24px phrases and 13px references. Remove duplicated loops, masks, transforms, and `aria-hidden`. |
| 03d3 — illustrative FaithFlow example | `components/sections/DashboardInvite.tsx`, `components/sections/faithflow/DashboardPreview.tsx` | Replace obsolete streak/mood/teaching claims and tabs with a labelled sample gathering, RSVP, calendar choices, prayer response, and reset. Existing public links stay. Both existing quotations remain verbatim in a native disclosure; no edition attribution added. |
| 03e — practice keyboard focus | `components/sections/PracticesScroll.tsx` | Keep the reviewed 24px edge fade. Inset the outline 28px so its complete border is inside the unmasked gutter. Inline offset deliberately outranks the unlayered global rule. Separate from the accepted 03c contrast patch. |
| 03f — Lenis teardown | `components/motion/SmoothScroll.tsx` | Stable React 19 ref cleanup calls public `stop()` before the wrapper destroys its instance. This resets scrolling state, so a late native-scroll timer cannot restore the class. No timer monkey-patch, dependency upgrade, or page remount. |

The growth scene pins only at width ≥1024px, height ≥760px, fine pointer, and no reduced-motion preference. All four passages stay in document reading order. Only the active visual panel accepts pointer interaction. The feathered mask applies to empty edges of the image artwork, never text. The original image assets and Next image optimization remain unchanged.

The preview demonstrates current tasks, not a pixel copy of the authenticated app. All details are explicitly fictional. Calendar options do not open a calendar or download a file; prayer and RSVP actions do not send anything. The persistent Notice reports the local result. There is no freeform reflection input, storage, auth interaction, server action, or service call. All visible controls are at least 44px tall; meaningful text is at least 14px and metadata at least 13px.

## Evidence and method

The final comparison is `.claude/recon/shots/public-batch2/{before,after}/capture.json`:

- Before: **27 PNGs / 27 distinct hashes**. After: **25 PNGs / 25 distinct hashes**. The two omitted scenarios are the removed old Scripture tab at 390 and 1280; its two passages are now tested and shown in the native disclosure.
- The capture script and health helper are byte-identical across the comparison: script SHA256 `62b83c2db829e20d66eca74037c70b55d7315fe03492d76a4e5b7d489a8838ed`; helper SHA256 `c54250438eb384862a02bbac0fd0a832338de3b75f34235873755820e2b86701`.
- Final production build: `unUS89JDkJ1bHHdI-N-dj`. Capture source hashes stayed stable; browser errors were zero. All 12 intended stage headings are in the viewport at full settled opacity, with corresponding images decoded.
- 390×844 and 1280×900 pairs cover the growth story, all three Scripture bands, and FaithFlow's surrounding claims and preview. Desktop reduced-motion captures show every normal-flow stage. These are sampled visual states, not an exhaustive animation proof or automated pixel comparison.
- Full element crops and ordinary viewport screenshots are labelled separately. The fixed navigation overlaps a strip of the tall phone preview crop and part of the section crop. Do not mistake that capture framing for deleted content. The after-only `supplement/390-preview-{top,bottom,scripture}.png` views provide readable framing and the open disclosure, without hiding navigation or changing page styles. Supplement captures also include actual 768×1024 and 1920×1080 views.
- Three interrupted attempts remain under `after-attempt1`, `after-attempt2`, and `after-attempt3`. They are diagnostic evidence, not the final comparison. Never aggregate their frames into a purported single successful run.

Useful pairs (under the before/after directories):

| Surface | 390px | 1280px |
| --- | --- | --- |
| Growth | `390-journey-normal-{1,2,3,4}.png` | `1280-journey-normal-{1,2,3,4}.png` |
| Scripture band | `390-{home,faithflow,scholarflow}-scripture-band.png` | `1280-{home,faithflow,scholarflow}-scripture-band.png` |
| FaithFlow | `390-faithflow-dashboard-{section,preview}.png` | `1280-faithflow-dashboard-{section,preview}.png` |

Codex visually reviewed the phone and desktop composition pairs. The inset focus-ring screenshots are `.claude/recon/verification/batch2-practice-focus-{390,1280}.png`. The final source detector reported no findings for the six changed production targets. Source checks are not a substitute for Claude's independent composition judgment.

## Verification

- Production build, TypeScript, 58 unit tests, and table checks pass.
- **25 public Playwright checks pass** on the final production build using the selected Node 24.19 runtime. Output: `.claude/recon/verification/batch2-public-production-final.log`.
- Coverage includes client/modified-click/Enter navigation; menu focus, Escape, resize and internal scroll; draft preservation; initial and live reduced motion; the Lenis timer window; all four images at 1x/2x through 390→768→1280→1920→390; the four-viewport bound; static flow at 320, 390, 768, short 1280, and 820 landscape; native practice-rail Tab focus; exact band pairs; preview keyboard actions, disabled guard, reset, persistent Notice, and open-state touch targets.
- Preview tests establish the interception route with one blocked synthetic POST, then observe zero action mutations, unchanged local/session storage hashes, no downloads/popups/navigation, and the exact two retained quotations. No real prayer, notification, calendar mutation, or emergency contact occurred.
- After-only supplement measurements check the rendered settled colors, font sizes, opacity, and absence of masks for growth eyebrows, all band references, and preview metadata on their solid backgrounds. They do not certify every text color on the site.

Use `playwright.public.config.ts` for this review; it never launches or stops a preview. All browser tests check preview health first. The fixture config is for the separate synthetic dashboard checks, not this public capture. With the current selected runtime:

```powershell
& 'C:\Users\lpell1\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/@playwright/test/cli.js test --config playwright.public.config.ts
```

The 640×450 layout check approximates reflow at 200% on a 1280×900 display. Actual browser zoom, physical iOS behavior, and authenticated dashboard end-to-end verification are **not** claimed for this batch.

## Preview liveness and the recovered evidence

See [LOCAL-PREVIEW.md](LOCAL-PREVIEW.md) and `.claude/recon/verification/batch2-preview-runtime-diagnosis.json`. The unavailable-server guard was reproduced deliberately. Later production exits were observed as Windows fast-fail code `0xC0000409` on Node 24.15.0. Isolated Sharp conversions passed, and bypassing image optimization did not prevent the failure; that experiment was reverted.

The final preview/build/capture use the existing bundled Node 24.19.0, explicitly selected with `-NodePath`. The complete capture and subsequent test run survived on that runtime. The upstream Node report makes the runtime explanation plausible, but no local native dump proves the exact stack. No system runtime, PATH, project dependency, or deployment setting was changed. Check the current helper status before review; no indefinite availability guarantee is made.

## Still outside this batch

Scripture contextual review remains incomplete (483 corpus passages pending in the existing checkpoint), and Stage 5 remains gated. There are no quotation substitutions, edition claims, new context displays, or changes to verse selection, tags, order, scoring, or calendar arithmetic. The package script verifies all eight frozen corpus/selection/membership/public-event files against HEAD. No dashboard migration, care-card change, auth/role/notification/scheduling contract change, database migration, API route, private-document change, or GraceFlow edit belongs here.

Claude's next task is independent review of these five slices and the named evidence. Separate reproduced defects from source-only observations and untested behavior, and assess the growth composition, reading band, and illustrative preview on both phone and desktop. Keep any follow-up fixes scoped; commit and publish only on the founder's explicit request.
