# Iron and Ember activity forms

Public hub: `/forms`. November 2026 poll: `/forms/november-2026-car-camping`.
Private organizer view: `/dashboard/forms`, also linked from the leader home for the organizer.

The public routes are omitted from the sitemap and main navigation and carry noindex metadata. These are shareable public links, not secret or access-controlled pages. No responses are exposed by a public GET endpoint.

Organizer access is checked on every page read and every status mutation using Clerk's server-side current user and a verified email address belonging to Lisandro (the established personal or proverbs address). A hidden URL, a regular session, an organization leader role alone, and client metadata do not authorize access.

The additive migration in `supabase/migrations/20261104012741_activity_forms.sql` creates separate form/response tables with RLS and no anon/authenticated privileges. Only service_role can call the submission RPC. Its form row lock serializes acceptance with closure. Duplicate UUID + payload hash acknowledges a saved response; changed content with that UUID conflicts. No personal information is returned to public callers. Dates are date-only November 2026 values; unknown is not treated as available. The poll expires December 1 at 07:00 UTC (midnight Mountain).

The API bounds streamed body size, validates fields, rejects cross-site requests, uses a honeypot and shared database rate limits (8 attempts per daily HMAC IP bucket per 10 minutes, 100 total attempts per hour), and fails closed if rate limiting or storage fails. Netlify's connection IP header is used, not untrusted forwarded-for. A missing platform IP shares an unknown bucket. The existing rate-limit housekeeping applies. Distributed abuse may still exhaust the global budget; this is not a CAPTCHA or a guarantee against abuse.

After durable storage, Resend sends one plain-text organizer email to proverbs@christfields2717.com using the existing RESEND_API_KEY and FROM_EMAIL configuration. No participant email is collected or auto-replied to. Provider acceptance is tracked; it is not proof of inbox delivery. Retries never send another email. If notification fails, the dashboard retains the response, and does not claim it was emailed. There is no automatic email retry worker.

Privacy notice: purpose, fields, Supabase storage, Resend/email copies, hosting technical data, necessary dashboard cookies, no new analytics or advertising cookies, and correction/deletion contact. Notes request scheduling information only. The age confirmation follows the existing site's 13+ policy, with a parent/guardian planning reminder for under-18s. No DOB is collected. This is not a legal opinion or a claim of legal compliance; a checkbox alone does not establish compliance with children's privacy requirements. Audience-specific legal review remains appropriate before expanding youth participation.

Closing a poll does not delete responses or email copies. No automatic retention/deletion promise is made. The organizer must handle access/correction/deletion requests across both database and mailbox. Anonymous names are self-reported, not verified identities. Refreshing after success can create a new response; in-tab retries are deduplicated. The dashboard displays the most recent 1,000 responses, with an explicit limit label.

No calendar events are created by a poll. Future activities require another configured form; a general template editor and QR artwork are not part of this release.

Calendar hardening: `syncFeedForUser` now lives in a `server-only` module instead of being an exported server action; authorized member, leader, and cron callers import it. New ICS connections fail closed without encryption. Existing legacy plaintext rows were not bulk changed.

Verification: `npm test`; `npm run type-check`; `npm run check:tables`; `npm run build`; `npx playwright test -c playwright.forms.config.ts` (installed Microsoft Edge). Browser fixtures mock all submission calls and send no email. Database smoke tests use a transaction and rollback. Production smoke tests must use invalid/rejected requests, not real submissions, unless a specific test email is authorized.
