import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed, expiring tokens that let a member act from an email or text link
 * without a session: answer an event, download its .ics.
 *
 * Token = base64url(payload) . base64url(HMAC-SHA256(payload, APP_TOKEN_SECRET))
 * payload = `${eventId}:${userId}:${expMs}` (ids never contain ':').
 *
 * Scope is one event and one member, expiry is a few days after the event, and
 * anything that mutates re-checks org membership and event status on the server.
 * Tokens travel in the URL fragment so mail scanners and trackers never see them.
 */

function secret(): string {
  const s = process.env.APP_TOKEN_SECRET;
  if (!s || s.length < 16) throw new Error('APP_TOKEN_SECRET is not configured.');
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest());
}

export interface TokenClaims {
  eventId: string;
  userId: string;
  expMs: number;
}

export function isTokenConfigured(): boolean {
  const s = process.env.APP_TOKEN_SECRET;
  return !!s && s.length >= 16;
}

export function mintToken(claims: TokenClaims): string {
  const payload = `${claims.eventId}:${claims.userId}:${Math.floor(claims.expMs)}`;
  return `${b64url(payload)}.${sign(payload)}`;
}

/** Null when malformed, tampered, or expired. */
export function verifyToken(token: string, nowMs: number = Date.now()): TokenClaims | null {
  try {
    if (!token || token.length > 512) return null;
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const payloadB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expected = sign(payload);
    const a = Buffer.from(sigB64);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const parts = payload.split(':');
    if (parts.length !== 3) return null;
    const [eventId, userId, expRaw] = parts;
    const expMs = Number(expRaw);
    if (!eventId || !userId || !Number.isFinite(expMs)) return null;
    if (expMs < nowMs) return null;
    return { eventId, userId, expMs };
  } catch {
    return null;
  }
}

/** Tokens live until three days after the event starts. */
export function tokenExpiryFor(startsAtISO: string): number {
  const start = new Date(startsAtISO).getTime();
  const base = Number.isNaN(start) ? Date.now() : start;
  return base + 3 * 86_400_000;
}

/**
 * A download token for one event, or undefined when the secret is not
 * configured (local dev before setup). The .ics route lives outside the Clerk
 * middleware so calendar apps can fetch it with no session; this is how a
 * signed-in member proves who they are to it.
 */
export function mintIcsToken(eventId: string, userId: string, startsAtISO: string): string | undefined {
  if (!isTokenConfigured()) return undefined;
  return mintToken({ eventId, userId, expMs: tokenExpiryFor(startsAtISO) });
}
