import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { authUrl, isGoogleConfigured, isGoogleFeature } from '@/lib/google/oauth';
import { isEncryptionConfigured } from '@/lib/security/crypto';
import { appUrl } from '@/lib/dashboard/prefs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Start a Google connect for ONE feature (?feature=write or ?feature=busy).
 * Under the Clerk middleware so the member is known; the signed state carries
 * their id to the callback. Plain navigation, so a link on the You page is
 * all the UI needs. Every precondition the callback will need is checked
 * here first, so nobody consents at Google for nothing.
 */
export async function GET(req: NextRequest) {
  const base = appUrl();
  const settings = `${base}/dashboard/settings`;
  const feature = req.nextUrl.searchParams.get('feature');
  if (!isGoogleFeature(feature)) return NextResponse.redirect(`${settings}?google=error`);
  if (!isGoogleConfigured() || !isEncryptionConfigured()) return NextResponse.redirect(`${settings}?google=unconfigured`);

  const { userId } = await auth();
  if (!userId) {
    // Come straight back here after signing in, intent intact.
    const target = `/api/google/connect?feature=${feature}`;
    return NextResponse.redirect(`${base}/dashboard/sign-in?redirect_url=${encodeURIComponent(target)}`);
  }
  try {
    return NextResponse.redirect(authUrl(userId, feature));
  } catch (err) {
    console.error('google connect could not start', err);
    return NextResponse.redirect(`${settings}?google=error`);
  }
}
