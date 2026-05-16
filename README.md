# christfields-site-v2

The next version of christfields2717.com. Built with Next.js 15, React 19, TypeScript, Tailwind CSS v4, and Motion.

This repo lives at `C:\Users\lpell\Projects\christfields-site-v2`. It should stay separate from the older live site folder unless we intentionally copy or deploy changes.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animation | Motion |
| Smooth scroll | Lenis |
| Hosting | Netlify |
| Forms | Netlify Forms |

## Run locally

```cmd
cd /d "C:\Users\lpell\Projects\christfields-site-v2"
npm install
npm run dev
```

Then open http://localhost:3000

## Current status

- Home page is built.
- FaithFlow page is built.
- Resource pages are built.
- Netlify Forms detection lives in `public/__forms.html`.
- Motion is used for route transitions, hero atmosphere, reveals, card interaction, buttons, form labels, and product preview motion.
- The FaithFlow tailored success card is intentional and should not be removed unless we decide to change that feature again.

## Project structure

```text
christfields-site-v2/
  app/
    layout.tsx
    page.tsx
    faithflow/page.tsx
    globals.css
  components/
    motion/
    sections/
    Nav.tsx
    Footer.tsx
    Logo.tsx
  lib/
    content/
    utils.ts
  public/
    __forms.html
    assets/
  netlify.toml
  next.config.ts
```

## What lives where

| Concept | Where to edit |
|---|---|
| Brand colors | `app/globals.css` inside the `@theme` block |
| Fonts | `app/layout.tsx` |
| Site-wide nav links | `components/Nav.tsx` |
| Footer columns | `components/Footer.tsx` |
| FaithFlow tailored success copy | `lib/content/faithflow.ts` |
| Netlify form detection | `public/__forms.html` |

## Notes

- Keep this repo separate from the public v1 folder until cutover is intentional.
- Avoid em dashes in user-facing copy.
- Do not remove the FaithFlow tailored success content without confirming the product direction first.
