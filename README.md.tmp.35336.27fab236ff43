# christfields-site-v2

The next version of christfields2717.com. Built with Next.js 15, React 19, TypeScript, Tailwind CSS v4, and Framer Motion.

This repo is being built alongside the live v1 site at `B:\C_Fieldssite`. It will replace v1 only after every phase below is reviewed and approved.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (CSS-first config in `app/globals.css`) |
| Animation | Framer Motion |
| Hosting | Netlify (planned, same as v1) |
| Forms | Netlify Forms |

## Run locally

```cmd
cd /d "B:\christfields-site-v2"
npm install
npm run dev
```

Then open http://localhost:3000

## Phase status

- [x] Phase 1. Foundation. Project scaffold, design tokens, fonts, base components, foundation page.
- [ ] Phase 2. Home page port (Hero, Vision, Ecosystem, Values, Join).
- [ ] Phase 3. FaithFlow page with tailored success card and ember scatter.
- [ ] Phase 4. Resources pages.
- [ ] Phase 5. Polish. Page transitions, image optimization, SEO, accessibility.
- [ ] Phase 6. Cutover. Domain switch from v1 to v2.

## Project structure

```
christfields-site-v2/
  app/
    globals.css          Tailwind v4 theme + ember animations
    layout.tsx           Root layout, fonts via next/font
    page.tsx             Foundation preview (Phase 1)
  components/
    Container.tsx        Centered 1160px wrapper
    Footer.tsx           Site footer with flame logo
    Logo.tsx             Christ Fields flame logo
    Nav.tsx              Sticky nav, mobile menu, scroll frosted glass
  lib/
    utils.ts             cn() helper for class names
  public/
    assets/              Logo, og-image, etc. (copied from v1)
  netlify.toml           Build config + security headers
  next.config.ts
  tailwind.config (none) Tailwind v4 is configured in globals.css
  tsconfig.json
```

## What lives where

| Concept | Where to edit |
|---|---|
| Brand colors | `app/globals.css` inside the `@theme` block |
| Fonts | `app/layout.tsx` (next/font config) |
| Site-wide nav links | `components/Nav.tsx` defaultLinks array |
| Footer columns | `components/Footer.tsx` defaultColumns array |
| Per-page content | Each `app/<route>/page.tsx` |

## Notes

- The flame logo animation is preserved exactly from v1. CSS lives in `app/globals.css`, controlled by the `<Logo />` component.
- Em dashes are NOT used in any user-facing copy. See the writing style preference in memory.
- The CSP in `netlify.toml` has `'unsafe-inline'` for script-src and style-src temporarily because Next.js inlines hydration scripts. Phase 5 tightens this with nonces.
