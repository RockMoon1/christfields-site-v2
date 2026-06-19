# YouVersion Platform — application + integration notes

Everything you need to apply for the YouVersion Platform and (once approved) switch FaithFlow's Bible text from the public-domain default to richer translations. **Nothing is blocked on approval** — the dashboard already pulls verified verses from the public-domain World English Bible today.

---

## The one thing to do BEFORE applying
Send YouVersion support a short note to confirm eligibility, because the tricky part (a free app inside a partly-commercial brand) is **undocumented and decided by a human reviewer**. Getting a written "yes" now avoids a painful post-launch revocation. Send via [platform.youversion.com/support](https://platform.youversion.com/support):

> Hi YouVersion Platform team — I'm building **FaithFlow**, a free, invite-only dashboard for a single small in-person Christian community group (~10 people). It has **no ads, no paywalls, no subscriptions**, and the Bible content is never gated or monetized. I want to confirm eligibility on one point before I build: FaithFlow is made by Christ Fields, which also offers separate **paid** apps (GraceFlow / LearnFlow) on its website. FaithFlow itself is and will remain entirely free; those paid apps are separate products marketed elsewhere, **not integrated into or upsold within** FaithFlow's YouVersion-powered surface. Does FaithFlow qualify as a non-commercial application under the Platform requirements given that context? I'd rather confirm now than risk an issue later. Thank you for making this available — it's a real gift to builders.

---

## The application form

| Field | What to put | Why |
|---|---|---|
| **Commercial App Status** | **Non-commercial** | Honest for FaithFlow: free, invite-only, no ads, no paywall. |
| **Application Name** | `faithflow` | ✓ |
| **Description** (≤140) | Option A: *"Free, invite-only dashboard for a small in-person Christian group: shared Scripture, prayer, and honest accountability, face to face."* (130) · Option B: *"A calm, free space for a small in-person faith group to keep Scripture, prayer, and accountability between gatherings. No ads, no paywalls."* (139) | Either reads true and non-commercial. |
| **Website** | `https://christfields2717.com/faithflow` | The public FaithFlow page. |
| **Callback URI** | `https://christfields2717.com/dashboard` (placeholder) | The callback is **only** for "Sign in with YouVersion" (OAuth). FaithFlow uses Clerk for login, so we go **content-only** and never use it — but the field wants a value. |
| **Google Play / App Store URLs** | leave blank | It's a web app, no native app. |
| **Developer spotlight** | optional, your call | Only opt in if you're comfortable being publicly listed; doesn't affect approval. |

**The attestations** (truly non-commercial, free in all respects, no paywalls, no ads on the integrated surface) are accurate for FaithFlow as it stands — and FaithFlow is *meant* to stay free forever (it's the community center, per the north star), so the permanent non-commercial lock fits its nature rather than fighting it. The only real risk is the brand-boundary question above — which the support note clears.

---

## Once approved — finishing the drop-in (≈ 20 min)
The code is already structured for this. Two steps:

1. **Set env vars** (Netlify → Environment variables — see `.env.example`):
   - `YOUVERSION_APP_KEY` — your Platform app key
   - `YOUVERSION_VERSION_ID` — the numeric Bible version id you want (e.g. the NIV)
   - `YOUVERSION_TRANSLATION` — short label, e.g. `NIV`
2. **Implement `lookup()`** in [`lib/bible/providers/youversion.ts`](../lib/bible/providers/youversion.ts) against the Platform **passages** endpoint (send the `X-YVP-App-Key` header and `format=text` — it returns HTML by default), mapping the response to a `BibleVerse`.

That's it. The source layer ([`lib/bible/index.ts`](../lib/bible/index.ts)) automatically prefers YouVersion when the key is present and **always falls back to the public-domain World English Bible**, so a half-finished or rate-limited YouVersion call can never break verse lookup.

---

## How it works today (no approval needed)
- **Default source: World English Bible** — public domain, modern, legally clean, no key, commercial-safe. Served by `bible-api.com` server-side and cached.
- **Where it shows up:** the "Add a verse to memorize" form now has a **Look up** button — a member types a reference (e.g. "Romans 8:1") and gets the verified text auto-filled (they can still paste their own). This is the highest-value spot: accurate, properly-licensed text instead of typing from memory.
- **Copyright note:** this is also the *legal* fix — modern translations (NIV/ESV/NLT/NASB) are copyrighted and can't be displayed at scale without a license/API. WEB (public domain) sidesteps that entirely; YouVersion handles the licensing for the copyrighted ones once you're in.
