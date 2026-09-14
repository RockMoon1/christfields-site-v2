# Isolated browser fixtures

These fixtures import the actual presentation components and CSS. Vite aliases
community/event/settings/availability/feedback server actions, Clerk, and Next navigation before loading them.
No production action implementation, environment file, account, database, email,
notification service, or emergency contact is used. The server binds only to
`127.0.0.1:3100`. A resolver refuses unexpected service/action imports.

All names, requests, events, and reflection content are synthetic. The fixture
states this visibly. Actions are manually resolved/rejected through controls
outside the component under test; `mode=success` and `mode=failure` provide
deterministic automatic variants. Next links are inert.

Run the suite with:

```text
node node_modules/@playwright/test/cli.js test --config=playwright.fixture.config.ts
```

The configuration starts the fixture server and reuses the local development
site on port 3000 when it is already running. Otherwise it starts that server
on loopback for the separate public-motion tests. Tests use Chromium's default
headless shell. Do not set `channel: chromium` to force a different browser.

For a manual fixture session:

```text
node scripts/serve-browser-fixture.mjs
```

Open `http://127.0.0.1:3100/?case=foundations`. Other cases are `community`,
`event`, `delete`, `header`, and `skeleton`. The header case simulates a 47px
safe-area inset. Skeleton accepts a `route` query parameter.

The suite covers field association/error space, pending button dimensions,
preserved prayer drafts, all four prayer failure paths, RSVP state/face rollback,
confirmation focus and retry behavior, safe-area geometry, skeleton widths, and
four foundation viewport screenshots. Fixture tests additionally block external
HTTP and all HTTP mutations.

This is component-fixture evidence, **not authenticated end-to-end verification**.
Clerk's own popover/auth behavior is not exercised. When a local build exists,
the fixture serves its exact Latin Inter/Cormorant font files and the nav logo.
`/fixture-fonts.json` identifies the bytes/checksums and explicitly reports a
fallback if no build exists. Production build and public-site browser checks
remain separate gates.

For dashboard-only work, start the fixture explicitly and use
`playwright.dashboard.config.ts`. That config never starts/stops port 3000.
The combined suite runs 51 tests: foundations, dashboard repairs and prayer-wall checks.
`case=settings`, `case=availability` and `case=community-page` mount the
actual async page JSX with mocked data (not RSC transport); add `shell=1` for
the real TopBar/Sidebar/MobileTabBar presentation and `route=/dashboard/settings`
or `route=/dashboard/availability` / `route=/dashboard/community`. `variant=connected`, `revoked`, `error`, or
`stale` supplies synthetic calendar states. PushSettingsCard is explicitly
omitted; no permission prompt, push registration, TimeZoneSync or PushSync runs.
Install instructions render without an installation prompt.

`case=community-page` has four synthetic requests, including owned, answered,
already-prayed and longer-content states; `variant=empty` supplies the empty wall.
The original two-card `case=community` remains for earlier component checks.

The Batch 3 checks include demonstrated blocked POST probes, measured solid
background contrast, seven viewport sizes, scoped CSS-zoom emulation, native
Tab walks, labelled 16px fields, 44px targets, and controlled failure recovery.
Prayer-wall checks now require automatic conditional focus recovery, retain exact
drafts through failure/retry, preserve intentional focus elsewhere, and verify
card-action rollback/success destinations. Normal and reduced-motion runs require
immediate form, list and empty-state content. The comparison capture uses a frozen
script and fixture instrument for eight distinct before/after frames per side.

Playwright files use `.pw.ts`; the existing Vitest suite includes only
`lib/**/*.test.ts`. The original config writes under `test-results/browser-fixture`;
the dashboard-only config writes under `test-results/dashboard`.
