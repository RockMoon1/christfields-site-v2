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
 * Scope middleware to /dashboard/* (the authenticated app) plus the two API
 * routes that read the session (a signed-in .ics download, saving a push
 * subscription). The public marketing site stays independent of Clerk, and so
 * do the routes that must work with no session: the subscribe feed, the push
 * ack from a service worker, the cron tick, and /r one-tap answers.
 */
export const config = {
  matcher: ['/dashboard/:path*', '/api/ics/event/:path*', '/api/push/subscribe', '/api/google/:path*'],
};
