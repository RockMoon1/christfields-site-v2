import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

/**
 * Clerk middleware. Anything matched by isProtectedRoute requires a signed-in
 * user. Anything else (the public marketing site, journal, faithflow, etc.) is
 * unaffected.
 *
 * Public sign-in / sign-up routes are explicitly excluded from protection so
 * users can actually reach them while signed out.
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

const isPublicAuthRoute = createRouteMatcher([
  '/dashboard/sign-in(.*)',
  '/dashboard/sign-up(.*)',
]);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicAuthRoute(req)) {
    await auth.protect();
  }
});

/**
 * Wrap Clerk's middleware to strip any CORS "allow" headers from responses we
 * emit. This site has no cross-origin API consumers, so a response should never
 * tell a browser to trust an arbitrary origin with credentials. Removing these
 * neutralizes the "Arbitrary Origin Trusted" class of finding for anything that
 * passes through our edge. (The authoritative fix for the auth handshake is a
 * Clerk production instance, which uses your own domain with strict CORS.)
 */
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const res = await withClerk(req, event);
  if (res) {
    res.headers.delete('access-control-allow-origin');
    res.headers.delete('access-control-allow-credentials');
  }
  return res;
}

/**
 * Scope middleware to /dashboard/* (the authenticated app) and the member-only
 * API routes that need Clerk. The public marketing site (home, journal,
 * faithflow) stays independent of Clerk.
 *
 * /api/verse must be matched so clerkMiddleware runs for it: its handler calls
 * auth() to identify the member, and auth() throws if the request never passed
 * through clerkMiddleware. It is NOT in isProtectedRoute, so it is not
 * force-redirected; the handler returns a clean 401 JSON when signed out.
 */
export const config = {
  matcher: ['/dashboard/:path*', '/api/verse'],
};
