# Security scan triage — christfields2717.com

Scanner: **Probely** (DAST) · Target: `https://christfields2717.com/` · Triaged: 2026-06-13
Host: Netlify edge (TLS terminated by Netlify; not a self-managed web server).

This file records the disposition of each scan finding with the evidence behind it,
so the scanner can be marked accordingly and future scans read clean. Re-run the
scan after marking; SSL Labs gives an independent second opinion on the TLS items:
https://www.ssllabs.com/ssltest/analyze.html?d=christfields2717.com

---

## 1. "Weak cipher suites enabled" — Medium (CVSS 4.2) → **FALSE POSITIVE**
## 2. "Secure TLS protocol version 1.2 not supported" — Low → **FALSE POSITIVE**
## 3. "No cipher suites supporting Forward Secrecy" → **FALSE POSITIVE**

All three contradict the live server. Verified directly against the production
endpoint on 2026-06-13 (`openssl s_client`, single apex A record `13.52.188.95`,
no IPv6/AAAA backend):

| Probe | Result |
|---|---|
| TLS 1.0 / 1.1 | **Refused** (`no protocols available`) — correct |
| TLS 1.2 | `ECDHE-ECDSA-AES128-GCM-SHA256` — ECDHE = forward secrecy, AEAD/GCM, no CBC |
| TLS 1.3 | `TLS_AES_128_GCM_SHA256` — modern AEAD |
| Key / cert | 256-bit ECDSA · Let's Encrypt (Netlify-managed) |
| HSTS | `max-age=63072000; includeSubDomains; preload` |

Every negotiated suite is forward-secret (ECDHE) and AEAD — there are no CBC, RC4,
3DES, DES, NULL, or export ciphers offered. TLS is managed by Netlify and cannot be
weakened by application code; the Apache/Nginx `SSLProtocol`/`SSLCipherSuite`
remediation Probely suggested does not apply to this platform.

**Action:** mark each as *False Positive* in Probely with the evidence above.

---

## 4. "Insecure Content Security Policy" — Low (CVSS 3.7) → **ACCEPTED RISK**

The CSP header is present and otherwise strict. Probely flags `'unsafe-inline'` in
`script-src` and `style-src`.

- `style-src 'unsafe-inline'` is **required** by the stack: the site (Next.js +
  Motion) renders pervasive inline `style=` attributes for animation. CSP nonces
  and hashes do not cover inline style *attributes*, so removal is not feasible
  without removing the product's motion design.
- `script-src 'unsafe-inline'` is currently needed for Next's inline hydration
  scripts. A nonce + `strict-dynamic` migration is the planned defense-in-depth
  fix (see Backlog) and is the only part of this finding that is code-fixable.

**Compensating controls (why residual XSS risk is low):**
- React output auto-escaping; no string-built / user-controlled HTML is rendered.
- The only inline `<script>` is first-party static JSON-LD in `app/layout.tsx`.
- The rest of the policy is strict: **no `'unsafe-eval'` in production**
  (dev-only, see `next.config.ts`), `frame-ancestors 'none'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
- Transport hardening: HSTS with `preload`, COOP/CORP `same-origin`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict
  `Referrer-Policy`, and a thorough `Permissions-Policy`.

**Action:** mark as *Accepted Risk* in Probely with the justification above.

---

## Backlog (defense-in-depth, not required for a clean scan)

- **Nonce-based `script-src` + `strict-dynamic`** to drop `'unsafe-inline'` for
  scripts. Touches `middleware.ts` + `next.config.ts` and must be tested against
  the authenticated Clerk dashboard (live, payments-adjacent), so it belongs to
  the security workstream that can exercise that flow — not a blind change.
  Note: this does not change the scan result on its own (the finding stays open
  while `style-src 'unsafe-inline'` remains), so it is hardening, not triage.
