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
- **Dashboard (Iron & Ember)** — `app/dashboard`, `components/dashboard`, `components/leader`, `lib/dashboard`
- **Leader readiness flow** — `app/leaders`, `components/leaders`, `lib/leaders`. ⚠️ `components/leader` (singular, dashboard) and `components/leaders` (plural, readiness) are different areas.
- **API routes** — `app/api/{submit,clerk-webhook}`
- **Data & infra** — `db/` (schema.sql + migrations), `lib/bible`, `lib/security`, `scripts/generate-icons.mjs`
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
