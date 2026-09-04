import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabase, type GoogleConnectionRow } from '@/lib/supabase';
import { verifyState, exchangeCode, refreshAccessToken, isGoogleConfigured, SCOPES } from '@/lib/google/oauth';
import { deleteCalendar } from '@/lib/google/calendar';
import { syncMemberCalendar } from '@/lib/google/sync';
import { encryptText, decryptText, isEncryptionConfigured } from '@/lib/security/crypto';
import { appUrl } from '@/lib/dashboard/prefs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Google sends the member back here. We check the signed state belongs to the
 * member who is signed in right now, swap the code for tokens, record exactly
 * the scopes Google says this token carries (consent is granular, and
 * include_granted_scopes already folds earlier grants in), encrypt the refresh
 * token at rest, tidy up anything a dropped scope leaves behind, and run a
 * short first sync so the calendar fills in before they look.
 */
export async function GET(req: NextRequest) {
  const base = appUrl();
  const settings = `${base}/dashboard/settings`;
  const back = (flag: string) => NextResponse.redirect(`${settings}?google=${flag}`);
  const q = req.nextUrl.searchParams;

  if (q.get('error')) return back('denied');
  if (!isGoogleConfigured() || !isEncryptionConfigured()) return back('unconfigured');

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(`${base}/dashboard/sign-in?redirect_url=${encodeURIComponent('/dashboard/settings?google=signin')}`);
  }
  const state = verifyState(q.get('state') || '');
  const code = q.get('code') || '';
  if (!state || state.userId !== userId || !code) return back('error');

  const ex = await exchangeCode(code);
  if (!ex.ok) {
    console.error('google exchange failed', ex.error);
    return back('error');
  }
  const wanted = SCOPES[state.feature];
  const granted = ex.scopes.filter((s) => s === SCOPES.write || s === SCOPES.busy);
  if (!granted.includes(wanted)) return back('denied');

  const sb = getSupabase();
  const { data } = await sb.from('google_connections').select('*').eq('clerk_user_id', userId).maybeSingle();
  const existing = data as GoogleConnectionRow | null;

  // prompt=consent always returns a refresh token; the old one is only reused for a healthy row.
  let refreshEnc: string;
  if (ex.refreshToken) refreshEnc = encryptText(ex.refreshToken);
  else if (existing?.refresh_token_enc && existing.status === 'ok') refreshEnc = existing.refresh_token_enc;
  else return back('error');

  // Scopes this token does NOT carry are gone: clean up what they governed.
  const hadWrite = !!existing?.scopes.includes(SCOPES.write);
  const hadBusy = !!existing?.scopes.includes(SCOPES.busy);
  const hasWrite = granted.includes(SCOPES.write);
  const hasBusy = granted.includes(SCOPES.busy);
  let cfCalendarId = existing?.cf_calendar_id ?? null;
  if (existing && hadWrite && !hasWrite) {
    if (cfCalendarId) {
      const oldToken = decryptText(existing.refresh_token_enc);
      if (oldToken) {
        const t = await refreshAccessToken(oldToken);
        if (t.ok) await deleteCalendar(t.accessToken, cfCalendarId);
      }
    }
    cfCalendarId = null;
    await sb.from('calendar_pushes').delete().eq('clerk_user_id', userId);
  }
  if (existing && hadBusy && !hasBusy) {
    await sb.from('calendar_busy').delete().eq('clerk_user_id', userId).eq('source', 'google');
  }

  const now = new Date().toISOString();
  const { error } = await sb.from('google_connections').upsert(
    {
      clerk_user_id: userId,
      refresh_token_enc: refreshEnc,
      scopes: granted,
      cf_calendar_id: cfCalendarId,
      status: 'ok',
      last_error: null,
      updated_at: now,
      ...(existing ? {} : { created_at: now }),
    },
    { onConflict: 'clerk_user_id' },
  );
  if (error) {
    console.error('google connection save failed', error);
    return back('error');
  }

  // A short first sync so something is there when they look; the tick finishes the rest.
  const until = Date.now() + 6_000;
  await syncMemberCalendar(userId, { deadline: () => Date.now() > until, maxCalls: 12 }).catch((err) =>
    console.error('first google sync failed', err),
  );
  return back(state.feature === 'write' ? 'calendar' : 'busy');
}
