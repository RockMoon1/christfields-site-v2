/**
 * Request-origin and size guards for API route handlers.
 *
 * Next.js Server Actions get built-in cross-origin protection, but raw route
 * handlers (app/api/.../route.ts) do not. These small helpers add that wall.
 */

/**
 * True when a request is a forged cross-site request (CSRF).
 *
 * `Sec-Fetch-Site` is set by the browser on every request and CANNOT be set
 * from JavaScript, so a request initiated by an attacker's page arrives as
 * `cross-site`. Same-origin / same-site calls from our own pages (and
 * non-browser clients that omit the header) pass through.
 *
 * This is layered on top of Clerk's `SameSite=Lax` session cookies (which
 * already stop the session cookie from riding a cross-site POST). It is cheap
 * defense-in-depth, and it also covers the unauthenticated form route where no
 * session cookie is involved.
 */
export function isCrossSite(req: Request): boolean {
  return req.headers.get('sec-fetch-site') === 'cross-site';
}

/**
 * True when the declared body is larger than `maxBytes`. Rejecting before
 * `req.json()` keeps a huge payload from burning memory/CPU on a serverless
 * function. Per-field length caps still apply after parsing; this is the coarse
 * outer guard. Requests without a Content-Length (e.g. chunked) are allowed
 * through to the platform limit rather than blocked here.
 */
export function isBodyTooLarge(req: Request, maxBytes: number): boolean {
  const len = Number(req.headers.get('content-length') ?? '');
  return Number.isFinite(len) && len > maxBytes;
}
