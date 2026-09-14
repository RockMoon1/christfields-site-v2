# Christ Fields design standard

This is the shared project standard for Claude and Codex. The founder's agreed September 2026 unified design, motion, and Scripture review controls this work. Codex implements; Claude independently reviews. One implementation owner, reviewable changes, no automatic commits or publishing.

## Identity and surfaces

Keep the existing logo, deep green, gold, ivory, Cormorant display type, and Inter reading type. Marketing earns attention through composition and the existing globe imagery. Dashboard content is immediately available. Journal and Scripture prioritize reading. Generic skill defaults cannot override these decisions.

- Public pages: asymmetric homepage hero, clear product shelf, two signature scenes (hero and growth story), useful links and honest availability.
- Dashboard: clear grouping, quiet materials, visible state and failures, native control behavior. No new entrance reveals.
- Reading: selectable HTML, approximately 65ch measure, one article progress indicator. No moving quotations or word-by-word Scripture entrances.

## Foundations

`app/globals.css` owns colors, display sizes, and section rhythm. Normal sections range 72–110px; large mission sections 96–170px. These are distinct scales, not a promise that every desktop gap is unchanged. Display tokens may have documented exceptions for genuinely different compositions.

Meaningful text is at least 14px; attribution and eyebrows at least 13px, in Inter. Native form controls use 16px. Dashboard controls target 44px minimum. Gold is for emphasis/commitment, muted brick for destructive or failed service states, a quiet recessed surface for care. Measure contrast against the actual composited background before approving a color use.

`components/ui` owns Surface, DashContainer, PageHeader, Input, Textarea, Field, and Notice. Extend `components/Button.tsx`; use `fx={false}` in the dashboard. Keep semantic HTML, labels, described errors, pending state, and an always-mounted live region. Native controls retain the global gold focus ring. Decorative borders are not substitutes for focus.

Migrate one family and one concern at a time. Counters identify duplication; they are not acceptance targets. Keep legitimate differences. Fix primitive shortcomings separately rather than growing ad hoc variants in individual pages.

## Motion and navigation

Direct interaction feedback generally 150–250ms. Longer choreography belongs only to the public signature scenes. Preserve the shared MotionProvider easing and reducedMotion setting, but explicitly disable remaining clip/filter/opacity loops and smooth scrolling under reduced motion. Content must also be readable before hydration. No delays on essential actions. Celebrate only confirmed success.

The growth story uses at most four viewport heights on capable desktops, with all scenes in ordinary stacked flow on phones, short screens, and reduced motion. Use existing images and transform-based depth; no new live 3D engine.

The implemented public growth scene pins only with a fine pointer, at least 1024px width and 760px height, and no reduced-motion preference. Its header is inside the four-viewport track. Otherwise each of the four images sits in its own natural-height reading row. Stage labels use the 13px meta floor. Feathering may soften an illustration's empty frame; never put readable text inside that mask.

The public Scripture band uses static, unboxed phrase/reference pairs in one, two, or four columns. Keep every supplied phrase and reference in source order; no marquee clones, moving tracks, or edge masks. Layout improvement does not verify quotation wording or editions.

FaithFlow's public dashboard example is labelled illustrative. Its gathering, RSVP, calendar choices, and prayer response use local state only, with visible feedback and reset. Do not collect visitor reflections, connect services, or simulate saving real activity. Preserve unresolved existing quotations in their native disclosure while Scripture review remains gated.

Mobile navigation contains focus, supports Escape, restores focus on dismissal, scrolls internally, and does not hide while it owns focus. Preserve the three-tab dashboard navigation. The dashboard top bar uses an outer safe-area inset and a separate 64px content row: a 47px inset gives 111px total. Keep its solid background and no backdrop filter.

## Care and destructive actions

The safety card is always immediately visible, never animated, and has no nested panel or alarm palette. Preserve the reviewed headline and notified/not-notified distinction verbatim. Contact actions have clearly written numbers and at least 44px targets. Quiet presentation must still be readable and recognizable. Notification failures remain explicit. Permanent reflection deletion requires a clear confirmation with pending state, error feedback, and focus handling.

## Scripture

The stored WEB Classic-family wording remains the working default. Verify exact provider provenance; do not silently substitute the Updated edition. Inventory all 522 passages and authored public quotations/claims, journal, resources, and transactional emails. Record exact words, reference, source and edition, usages, speaker/audience, literary context, historical uncertainty, explained cross-references, and the site's application. Separate text, reconstruction, and interpretation. Punctuation flags are review prompts, never automatic repairs.

Revised quotations, attribution, and context displays wait for the source/context review. Unresolved cases retain existing wording and enter the concern log. Removing attribution does not resolve permissions. Leader-supplied text is never silently rewritten or attributed to a translation without verification.

Freeze verse-selection functions, theme scoring, corpus order, tags, and calendar arithmetic. The at-least 366 condition and leap-year calculation are correct. Defer the lust/temptation tag collision. Context is additive server-only presentation data, generated explicitly and cached; no runtime Bible fetch. Both reflection actions must update verse/context together. Do not expose leader-only context_notes or alter public-event filtering.

## Verification and scope

Record baseline and after evidence at 390/768/1280/1920, spot-check320/820/landscape/200% zoom. Distinguish browser observations, emulation, fixture checks, and authenticated end-to-end checks. Intercept mutations before they reach services; never call emergency numbers or send prayers/emails in tests. Check keyboard flow, draft preservation, rollback, confirmation, safe areas, reduced motion, exact Scripture pairing, touch targets, and WCAG contrast (4.5:1 ordinary text; 3:1 at 24px normal or 18.67px bold).

Run type checks, unit tests, table checks, and production build at meaningful stage boundaries. Before/after screenshots receive visual review; do not claim automated pixel comparison without running it.

No DB migrations, new API routes, auth/role/notification/scheduling contract changes, new dashboard features, privacy changes, or edits in GraceFlow. Preserve `app/r/[eventId]`, membership authorization, the privacy page's GraceFlow NVIDIA paragraph, and existing empty-state wording. Publish only when the founder explicitly asks, through the existing GitHub→Netlify workflow.
