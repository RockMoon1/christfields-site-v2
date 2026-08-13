import { NextResponse, type NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Clerk webhook: everyone who joins FaithFlow is added to Iron and Ember.
 *
 * Sign-up is invitation-only (Clerk Restricted mode), and an invitation lands
 * a new member in exactly one org — usually their small group. This webhook
 * completes the Iron & Ember structure by also enrolling every new user into
 * the main community org, so community-wide events and the shared prayer wall
 * reach them from day one.
 *
 * Inert until configured. Setup (founder steps, in the Clerk dashboard):
 *   1. Create the Iron and Ember organization; put its org id in
 *      MAIN_COMMUNITY_ORG_ID (Netlify env).
 *   2. Add a webhook endpoint for https://christfields2717.com/api/clerk-webhook
 *      subscribed to the user.created event; put its signing secret in
 *      CLERK_WEBHOOK_SIGNING_SECRET (Netlify env).
 * Requests are authenticated by the Svix signature (verifyWebhook), not by a
 * session — Clerk posts cross-site, so this route must not use isCrossSite.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const mainOrgId = process.env.MAIN_COMMUNITY_ORG_ID;
  if (!mainOrgId || !process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    // Not configured yet: refuse rather than silently accept unverifiable posts.
    // Name which variable is missing (never its value) so setup is not a
    // guessing game. Clerk only ever sees this while the endpoint is unwired.
    const missing = [
      mainOrgId ? null : 'MAIN_COMMUNITY_ORG_ID',
      process.env.CLERK_WEBHOOK_SIGNING_SECRET ? null : 'CLERK_WEBHOOK_SIGNING_SECRET',
    ].filter(Boolean);
    return NextResponse.json(
      { ok: false, error: 'Not configured', missing },
      { status: 503 },
    );
  }

  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 });
  }

  if (evt.type !== 'user.created') {
    return NextResponse.json({ ok: true, ignored: evt.type });
  }

  const userId = evt.data.id;
  try {
    const client = await clerkClient();
    await client.organizations.createOrganizationMembership({
      organizationId: mainOrgId,
      userId,
      role: 'org:member',
    });
  } catch (err) {
    // Already a member (e.g. the invitation itself was into the main org):
    // that is success, not an error. Match Clerk's precise error code — a
    // status-only check would swallow real 4xx failures (renamed role key,
    // org quota exceeded) as success, and Clerk would never retry them.
    const clerkErr = err as { status?: number; errors?: { code?: string }[] };
    if (clerkErr.errors?.some((e) => e.code === 'already_a_member_in_organization')) {
      return NextResponse.json({ ok: true, alreadyEnrolled: true });
    }
    // Anything else: 500 so Clerk retries the delivery, with the error code
    // (never user data) in the logs so a dead delivery is diagnosable.
    console.error('Iron & Ember auto-enroll failed', {
      status: clerkErr.status,
      code: clerkErr.errors?.[0]?.code,
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
