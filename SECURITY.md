# Security

Report suspected vulnerabilities privately to proverbs@christfields2717.com;
see `/.well-known/security.txt`. Do not include credentials or private responses
in public issues. This document describes controls and limits, not a guarantee
of security, legal compliance, or an ASVS certification.

## Review baseline

The November 2026 review uses [OWASP ASVS 5.0.0](https://asvs.owasp.org/)
as a requirements checklist, prioritizing Level 1 and risk-relevant Level 2
controls. It is not a complete ASVS assessment. Threat mappings include
[public-facing application exploitation (T1190)](https://attack.mitre.org/techniques/T1190/),
[application exhaustion (T1499.003)](https://attack.mitre.org/techniques/T1499/003/),
[network denial of service (T1498)](https://attack.mitre.org/techniques/T1498/),
and [credential stuffing (T1110.004)](https://attack.mitre.org/techniques/T1110/004/).
ATT&CK describes adversary behavior; it is not a compliance standard.

## Application controls

- Clerk session and server-side membership/leader checks protect member actions.
  Public form organizer actions separately require a verified founder email.
  Service-role queries bypass RLS, so every server entry point needs its own
  authorization check. A hidden URL is not access control.
- Activity responses, receipts and photos are not directly readable by browser
  database roles. Public listings project only approved event fields. Contact
  data and response lists never belong in public listings.
- Public availability responses use bounded streaming input, strict validation,
  atomic submission deduplication and shared IP/global limits. Generic contact
  forms use bounded input, canonical-origin checks, shared limits and fixed
  acknowledgments limited per unverified recipient. Generic contact submissions
  do not yet have database-backed retry deduplication.
- Shared rate-limit failures deny protected operations. Urgent member safety
  email retains its explicit existing exception; it is not an unlimited public
  email endpoint. Fixed-window limits can allow bursts near window boundaries.
- Push endpoints are restricted to supported browser push providers at both
  registration and delivery. Checked public DNS answers are pinned to the TLS
  connection. The installed web-push transport uses `https.request` without
  redirect following; retain this behavior during dependency upgrades. Unknown
  providers are rejected rather than treated as arbitrary HTTPS destinations.
- Calendar feeds allow known provider hosts, revalidate redirects, check DNS,
  stop streaming after 2 MB, and share a two-per-minute per-user refresh limit.
  DNS for calendar fetches is checked before fetch but is not socket-pinned;
  provider allowlisting remains essential. New calendar bearer URLs require
  encryption configuration. Raw feed URLs/network exceptions are not logged.
- Event images require founder authorization, bounded compressed/pixel sizes,
  still JPEG/PNG/WebP decoding, and WebP re-encoding with metadata removal.
- CSP, HSTS, frame denial and MIME-sniffing prevention headers are configured.
  CSP still permits inline scripts for Next hydration; a tested nonce migration
  is a follow-up, not an existing protection. React escaping and input validation
  reduce injection risk but do not establish that XSS is impossible.

## DDoS and operational limits

Application limits run after requests reach serverless infrastructure and can
still consume function/database resources. They do not stop volumetric network
attacks or guarantee a spending ceiling. Netlify documents built-in DDoS
protection and [additional rate limits](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).
Code-based edge rules have plan limits and enforcement delay; framework-created
functions require deployment-specific verification. No new WAF, edge rules,
paid plan, account permissions or authentication settings were enabled by this
code review. Provider-level configuration and monitoring need owner review.

## Verification and remaining work

- Mocked regression tests cover fail-closed counters, invalid-body quota use,
  public projection, founder authorization, malicious uploads, receipt tokens,
  push destination bypasses/DNS pinning, calendar streams and refresh limits.
  These tests send no real messages and do not load-test production.
- Production npm audit reported zero known advisories on 2026-11-04. The full
  development tree still reported 14 moderate and one high advisory, including
  tooling dependencies. Review compatible updates separately; do not force
  downgrade/major overrides simply to silence the report.
- A heuristic scan of current source found no matching credential patterns.
  This is not proof that all historical commits, binaries, excluded paths or
  account configuration contain no secrets. Never print secret values in logs.
- GitHub required checks/branch protection, least-privilege workflow tokens,
  pinned actions, account MFA, backup restore exercises and incident procedures
  require continuing review. Repository/account security settings need explicit
  approval; they were not changed in this release.
- Distinguish a successful application CI/build from external database preview
  checks. Supabase history filenames were aligned with recorded versions using
  matching normalized SQL hashes; no production migration records or schema
  were repaired or rewritten. Fresh database bootstrapping from the older
  `db/migrations` history remains a separate exercise.
- A saved response, provider acceptance, inbox receipt and verified mailbox are
  different states. Do not claim delivery or attendance from a successful save.
