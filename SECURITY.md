# Security

Plain-language record of how Christ Fields is secured. Last updated 2026-06-05,
after a 5-reviewer code audit and an LLM Council pass.

## Where we are already strong (verified)

- **Access control.** Every database read/write is locked to the signed-in
  user's real ID from the server. A member cannot reach another member's data,
  a leader cannot see another group, and leaders only ever see derived metrics
  and explicitly shared prayers, never anyone's private journal, examen, mood
  notes, or unshared prayers.
- **No SQL injection.** Every query uses the safe, parameterized builder.
- **No XSS.** All user and AI text renders as escaped React text; the journal
  does not allow raw HTML; emails escape user input.
- **Strong headers + secrets.** HSTS, a real Content-Security-Policy,
  clickjacking protection, and no secrets committed to the repo.

## Hardened on 2026-06-05

- Updated Clerk to 7.4.3, clearing a known dependency vulnerability (`js-cookie`).
- Cross-site (CSRF) and request-size guards on both API routes
  (`lib/security/origin.ts`), layered on Clerk's `SameSite` cookies.
- Closed the calendar-connect SSRF (`lib/dashboard/ics.ts`): redirects are
  followed manually with the allowlist re-checked on every hop, and any host
  that resolves to a private/loopback/link-local/cloud-metadata address is
  refused.
- Durable, shared rate limiting (`lib/rate-limit.ts` + migration 011). It
  activates automatically once the migration is run; until then the routes use
  their existing in-memory limiter, so nothing regresses.
- Light PII reduction (email/link/phone) before any prayer text is sent to the
  AI model, plus an honest in-app note that a model is involved and the words
  are not saved or shared with the group.
- Removed a latent unsafe-HTML render path in the FaithFlow success card.
- Added this file and a vulnerability-disclosure file (`/.well-known/security.txt`).
- Removed leftover `*.tmp.*` files from the repo.

## Founder action checklist (only you can do these)

1. **Turn on two-factor (an authenticator app or passkey, NOT text-message)**
   on every account that can reach the platform or its recovery: your email
   (the master key), GitHub, Netlify, Clerk, Supabase, Resend, and NVIDIA.
   This is the single highest-value step.
2. **Run two SQL files in the Supabase SQL editor** (safe and non-breaking):
   `db/migrations/010_rls.sql` (a database deny-by-default backstop) and
   `db/migrations/011_rate_limits.sql` (turns the durable rate limiting on).
3. **Confirm Clerk settings:** invitations expire and are single-use (default),
   removing a member ends their session, and consider requiring 2FA for leaders.
4. **Backups:** confirm Supabase backups / point-in-time recovery are on, and do
   one test restore so you know it actually works.
5. **Keep a one-page "if something leaks" plan:** how to rotate the Supabase
   service-role key, the Clerk keys, and the Resend key.

## Reporting a vulnerability

Email proverbs@christfields2717.com. See `/.well-known/security.txt`.

## Deliberately NOT done (over-engineering at our size)

SOC2, a WAF, a SIEM, paid pen-test retainers, bug bounties, and distributed
rate-limit clusters. For a small, single-group, invite-only community these add
cost and complexity without real benefit yet.

## Known follow-ups (each as its own careful, tested change)

- **CSP nonce migration** — remove `'unsafe-inline'` from `script-src`. Done on
  its own because a mistake here can break every script on the site.
- **RLS Phase B** — move per-member reads to a Clerk-JWT Supabase client so the
  database itself enforces "only your rows," binding even the founder.
- **Optional:** an audit log of leader/cross-group views, and a member-facing
  "who can see this" page.
