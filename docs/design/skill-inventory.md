# Design skill inventory

Verified and installed on 2026-09-07 America/Denver (2026-09-08 UTC).

The reusable skills live in the founder's personal Codex library at
`C:\Users\lpell1\.codex\skills`. Project decisions belong in this repository's
design standard. Installing a skill does not install a project dependency,
change Claude's configuration, or enable an automatic editing hook.

## Installed sources

Each installed upstream file was compared byte for byte with its pinned GitHub
archive. All seven installations passed. The official Codex skill installer
performed the installations; no existing destination was overwritten.

| Installed skill | Upstream directory | Files | Use here |
| --- | --- | ---: | --- |
| `emil-design-eng` | `emilkowalski/skills:skills/emil-design-eng` | 1 | Motion purpose, frequency, accessibility, interaction craft |
| `animate` | `emilkowalski/skills:skills/animate` | 2 | Implement the agreed public motion and direct interaction feedback |
| `improve-animations` | `emilkowalski/skills:skills/improve-animations` | 3 | Read-only motion audits and implementation specifications |
| `review-animations` | `emilkowalski/skills:skills/review-animations` | 2 | Independent review of completed motion changes |
| `impeccable` | `pbakaus/impeccable:.agents/skills/impeccable` | 56 | Layout, typography, spacing, accessible UI, and visual review |
| `design-taste-frontend` | `Leonxlnx/taste-skill:skills/taste-skill` | 1 | Public page composition and avoiding generic templates |
| `redesign-existing-projects` | `Leonxlnx/taste-skill:skills/redesign-skill` | 1 | Audit and improve existing surfaces within the current stack |

File counts exclude the added provenance and license copies.

| Repository | Pinned commit | License |
| --- | --- | --- |
| [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7) | `d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7` | MIT |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable/tree/2bc2879276c1f321a53c4ca99d3371e411329b52) | `2bc2879276c1f321a53c4ca99d3371e411329b52` | Apache-2.0, with NOTICE |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/ccbc15639c97057cbfcf32ecebc38ef716e4bb37) | `ccbc15639c97057cbfcf32ecebc38ef716e4bb37` | MIT |

Every installed folder contains `_upstream/LICENSE` and
`_upstream/install.json`. The manifest records the repository, commit, source
directory, installation time, individual file SHA-256 hashes, and comparison
with the existing Claude copy. Impeccable additionally retains
`_upstream/NOTICE.md`.

## Compatibility and project authority

- The four Emil skills and two Taste skills match the corresponding Claude
  files after normalizing line endings. They can be reused directly.
- Impeccable uses its upstream **Codex distribution**, version 4.2.2, with
  engine 0.1.3. It intentionally differs from the Claude distribution in 32
  shared files and includes five Codex agent/metadata files. Those differences
  are upstream platform adaptations, not local rewrites. Its 23-command table
  includes the deprecated `craft` alias.
- The user-approved plan and project standard take precedence over generic
  skill preferences. Keep Cormorant, Inter, the existing logo, and the
  green/gold/ivory identity. A skill's generic font blacklist or preference for
  a new palette does not authorize a rebrand.
- Use Impeccable's **Persuade** mode for public product pages, **Read** for
  journal/resources/Scripture content, and **Operate** for the dashboard.
  Taste explicitly excludes dashboards and complex product workflows.
- Routine dashboard content remains immediately visible. Reduced-motion
  behavior follows the stricter approved plan: no delayed content, smooth
  scrolling, decorative loops, parallax, or clip/blur entrances. A review
  skill's generic advice to retain fades does not override that rule.
- The existing Motion/Lenis stack and shared tokens remain the starting point.
  No GSAP, new design framework, or hook is required. The separate `gpt-taste`
  skill and unrelated Claude skills were not installed.
- Review/audit skills keep their scoped role; installing them does not hand
  them ownership of implementation or authorize unrelated changes.

## Impeccable context result

The context command ran successfully once from this repository for
`app/page.tsx`. It found an incumbent visual implementation and no existing
`PRODUCT.md`, `DESIGN.md`, or matching surface brief. It recognized the existing
code/assets as design authority for refinements. The approved conversation and
shared project standard provide the settled constraints; missing optional skill
documents do not reopen those decisions.

No automatic detector hook is active. After the planned web UI changes are
finished, run the installed command once against the changed targets:

```powershell
& 'C:\Users\lpell1\.codex\skills\impeccable\scripts\impeccable.cmd' detect --json <changed-targets>
```

At the first implementation checkpoint, the detector ran successfully against
`components/ui`, Button, Nav, Hero, and TopBar. It returned `[]`. Its saved
output is `.claude/recon/verification/impeccable.json`; this scoped result is
not a whole-site visual or accessibility approval.

Treat detector findings as evidence to assess against the brief. They do not
replace browser verification, accessibility testing, or the Scripture review.
Before UI edits, the implementation owner reads Impeccable's applicable
playbook and `reference/craft-floor.md`; the context command need not be rerun
in the same session.

The installed skills will appear in Codex's skill catalog on the next turn.
Their files are already available for this implementation session.

Figma and Playwright MCP connection changes were not part of this installation.
Browser verification uses the tools available to the implementation owner;
configured services must not be reported as connected or authenticated without
verification.
