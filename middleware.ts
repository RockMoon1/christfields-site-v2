import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicAuthRoute(req)) {
    await auth.protect();
  }
});

/**
 * Scope middleware to /dashboard/* only. This keeps the public marketing site
 * (home, journal, faithflow) completely independent of Clerk. Without this
 * narrow matcher, every public request would invoke Clerk, which would fail
 * if Clerk env vars are not configured in the environment.
 */
export const config = {
  matcher: ['/dashboard/:path*'],
};
