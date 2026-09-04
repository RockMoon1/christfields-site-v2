import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { appUrl } from '@/lib/dashboard/prefs';

/**
 * Google OAuth for the two Calendar features, on our OWN OAuth client (never
 * through Clerk's Google sign-in: Clerk resets extra scopes on every sign-in
 * and does not refresh tokens for us).
 *
 * Two scopes, and only these two, each asked for on its own when the member
 * taps that card:
 *   write  calendar.app.created  make a "Christ Fields" calendar and manage
 *                                events on it; cannot see any other calendar
 *   busy   calendar.freebusy     free/busy ranges only; never a title
 *
 * The state parameter is an HMAC over (member, feature, expiry, nonce) under
 * APP_TOKEN_SECRET, so the callback can prove the redirect started here, for
 * this member, within the last ten minutes.
 */

export const SCOPES = {
  write: 'https://www.googleapis.com/auth/calendar.app.created',
  busy: 'https://www.googleapis.com/auth/calendar.freebusy',
} as const;

export type GoogleFeature = keyof typeof SCOPES;

export function isGoogleFeature(v: unknown): v is GoogleFeature {
  return v === 'write' || v === 'busy';
}

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const STATE_TTL_MS = 10 * 60_000;
const TIMEOUT_MS = 8_000;

export function isGoogleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

export function redirectUri(): string {
  return `${appUrl()}/api/google/callback`;
}

/* ------------------------------------------------------------ state */

function secret(): string {
  const s = process.env.APP_TOKEN_SECRET;
  if (!s || s.length < 16) throw new Error('APP_TOKEN_SECRET is not configured.');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function mintState(userId: string, feature: GoogleFeature, nowMs: number = Date.now()): string {
  const payload = `${userId}:${feature}:${nowMs + STATE_TTL_MS}:${randomBytes(8).toString('base64url')}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

export function verifyState(state: string, nowMs: number = Date.now()): { userId: string; feature: GoogleFeature } | null {
  try {
    if (!state || state.length > 512) return null;
    const dot = state.indexOf('.');
    if (dot <= 0) return null;
    const payload = Buffer.from(state.slice(0, dot), 'base64url').toString('utf8');
    const a = Buffer.from(state.slice(dot + 1));
    const b = Buffer.from(sign(payload));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const [userId, feature, expRaw] = payload.split(':');
    if (!userId || !isGoogleFeature(feature)) return null;
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || exp < nowMs) return null;
    return { userId, feature };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ redirect */

export function authUrl(userId: string, feature: GoogleFeature): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPES[feature],
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: mintState(userId, feature),
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/* ------------------------------------------------------------ tokens */

export interface ExchangeOk {
  ok: true;
  accessToken: string;
  refreshToken: string | null;
  scopes: string[];
}

export async function exchangeCode(code: string): Promise<ExchangeOk | { ok: false; error: string }> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !json.access_token) return { ok: false, error: json.error_description || json.error || `token ${res.status}` };
    return {
      ok: true,
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      scopes: (json.scope || '').split(/\s+/).filter(Boolean),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'exchange failed' };
  }
}

/** `revoked` is true when Google says the grant is gone for good (invalid_grant). */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ ok: true; accessToken: string; scopes: string[] } | { ok: false; error: string; revoked: boolean }> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => ({}))) as { access_token?: string; scope?: string; error?: string; error_description?: string };
    if (!res.ok || !json.access_token) {
      return { ok: false, error: json.error_description || json.error || `refresh ${res.status}`, revoked: json.error === 'invalid_grant' };
    }
    return { ok: true, accessToken: json.access_token, scopes: (json.scope || '').split(/\s+/).filter(Boolean) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'refresh failed', revoked: false };
  }
}

/** Best effort; Google answers 200 whether or not the token was still live. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // nothing to do; the row is deleted either way
  }
}
