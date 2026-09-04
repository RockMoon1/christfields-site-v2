# Christ Fields v2 — guide for any Claude session in this folder

**You are the Christ Fields AI. This repo is the Christ Fields company platform (v2), a Next.js/TypeScript app. It is the home for the company brand + FaithFlow + ScholarFlow + the journal + the dashboard.**

> 🚧 STAY IN THIS REPO. Do **not** edit GraceFlow or LearnFlow — those are a SEPARATE live app at `B:\graceflow` (its own repo + Netlify deploy). If a task is about the GraceFlow PWA or the LearnFlow "Study" tab, it belongs in `B:\graceflow`, **not here.** If you need GraceFlow in the site, **link to it** (graceflows.netlify.app) — don't rebuild it here. Full map: `B:\OLD-history-Sit\PROJECT-MAP.md`.
>
> ⚠️ ONE chat per repo at a time. Parallel chats editing this repo caused confusion on 2026-06-03.
>
> 📦 Moved 2026-06-03 from `C:\Users\lpell\Projects\christfields-site-v2` → `B:\christfields-site-v2` (everything on B: now). The retired static **v1** site is `B:\OLD-history-Sit`.

## What this is
The Christ Fields company platform — the "front of house" for the whole ecosystem.
- **FaithFlow** — `app/faithflow`, `app/faithflow-resources`, `components/sections/faithflow`, `lib/faithflow`; page copy in `lib/content/faithflow.ts`
- **ScholarFlow** — `app/scholarflow`, `app/scholarflow-resources`, `components/sections/scholarflow`, `components/motion/ScholarFlowPreview.tsx`; page copy in `lib/content/scholarflow.ts`
- **Journal** — `app/journal`, `components/journal`, `content/journal/*.mdx` (the only MDX in the repo)
- **Dashboard = the community schedule manager (rewritten 2026-09)** — `app/dashboard/(app)` (Home, `e/[id]` event, `community` prayer wall, `settings` = You, `availability`, `lead/*` for leaders), `components/dashboard`, `components/lead`, `lib/dashboard`, `lib/schedule`, `lib/groups/membership.ts` (the ONLY file that reads Clerk organizations; every read passes `assertMemberOf`, every leader write `requireLeaderOf`), `lib/notify`. Two roles only: member and leader. No teaching features; do not add scores, streaks, tabs, or settings knobs. Member payloads go through `lib/schedule/public-event.ts`.
- **One-tap answer from email** — `app/r/[eventId]` (outside `/dashboard`, HMAC tokens in the URL fragment, POST-only mutation).
- **Leader readiness flow** — `app/leaders`, `components/leaders`, `lib/leaders`. ⚠️ `components/leader` (singular, the Clerk roster panel) and `components/leaders` (plural, readiness) are different areas.
- **API routes** — `app/api/{submit,clerk-webhook,ics/event/[id],ics/feed/[token],push/subscribe,push/ack,push/rotate,cron/tick}`. Only `ics/event` and `push/subscribe` sit under the Clerk middleware; the rest authenticate themselves (bearer secret, signed token, or endpoint knowledge).
- **Google Calendar (Phase 3, opt-in)** — `lib/google/{oauth,calendar,sync}.ts`, `app/api/google/{connect,callback}`, `components/dashboard/GoogleCards.tsx`. Own OAuth client, two scopes only (`calendar.app.created`, `calendar.freebusy`), never via Clerk. Hidden until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` exist. Setup steps in `docs/CONNECT-THESE.md` section 5.
- **Notifications** — `lib/notify` (`rules` = the pure limits/quiet-hours/tiers, `deliveries` = dedupe ledger, `push`, `email` = tiered Resend budget, `templates`, `fanout` = post/change/cancel/thanks/nudge, `scheduled` = what the hourly tick does), `public/sw.js`, `components/dashboard/PushSetup.tsx`, `netlify/functions/tick.mts` (Netlify Scheduled Function, @hourly, POSTs `/api/cron/tick` with `CRON_SECRET`), `.github/workflows/keepalive.yml`
- **Data & infra** — `db/` (schema.sql + migrations; 018 is the schedule schema, 019 drops the teaching tables), `lib/security`, `scripts/{generate-icons.mjs,check-tables.mjs}`, `.github/workflows/ci.yml`
- **Plan of record** — `C:\Users\lpell1\.claude\plans\alright-so-we-re-gonna-typed-kahan.md` (the approved 360 plan; Phase 2 = notifications + hourly tick, Phase 3 = Google Calendar opt-in)
- Shared: `components/{Nav,Footer,Logo,Container,Reveal}.tsx`, `components/motion`, `app/layout.tsx`, `app/globals.css`

## Stack & deploy
- **Next.js (App Router) + TypeScript + Tailwind.** Has a build step.
- Repo: `github.com/RockMoon1/christfields-site-v2` → deploys via **Netlify (from GitHub)**.
- Secrets in `.env.local` (gitignored): Clerk, Supabase, etc.
- Dev: `npm install` → `npm run dev`. Build: `npm run build`.

## Working rules
- **Verify in the browser** before claiming done.
- **Commit/push only when the founder asks.**
- **`docs/private/` is LOCAL-ONLY** (gitignored): real legal/business documents.
  Never commit or copy them anywhere, never quote their contents in committed
  files, and **never run `git clean -x`** in this repo (it would delete them).
- GraceFlow + LearnFlow are NOT here and are NOT to be rebuilt here — they live at `B:\graceflow`.
