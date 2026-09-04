import { beforeAll, describe, expect, it } from 'vitest';
import { mintToken, verifyToken, tokenExpiryFor, mintIcsToken, mintRsvpToken } from './tokens';

describe('one-tap answer tokens', () => {
  beforeAll(() => {
    process.env.APP_TOKEN_SECRET = 'test-secret-that-is-long-enough-123456';
  });

  it('round-trips valid claims', () => {
    const exp = Date.now() + 60_000;
    const token = mintToken({ eventId: 'evt_1', userId: 'user_1', expMs: exp, purpose: 'rsvp' });
    const claims = verifyToken(token, 'rsvp');
    expect(claims).toEqual({ eventId: 'evt_1', userId: 'user_1', expMs: Math.floor(exp), purpose: 'rsvp' });
  });

  it('rejects an expired token', () => {
    const token = mintToken({ eventId: 'evt_1', userId: 'user_1', expMs: Date.now() - 1, purpose: 'rsvp' });
    expect(verifyToken(token, 'rsvp')).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = mintToken({ eventId: 'evt_1', userId: 'user_1', expMs: Date.now() + 60_000, purpose: 'rsvp' });
    const [payload, sig] = token.split('.');
    const forged = Buffer.from('evt_1:user_2:' + (Date.now() + 60_000) + ':rsvp', 'utf8').toString('base64url');
    expect(verifyToken(`${forged}.${sig}`, 'rsvp')).toBeNull();
    expect(verifyToken(`${payload}.${sig.slice(0, -2)}xx`, 'rsvp')).toBeNull();
  });

  it('keeps purposes apart: an .ics token cannot answer, an answer token cannot download', () => {
    const start = new Date(Date.now() + 86_400_000).toISOString();
    const ics = mintIcsToken('evt_1', 'user_1', start)!;
    const rsvp = mintRsvpToken('evt_1', 'user_1', start)!;
    expect(verifyToken(ics, 'ics')?.userId).toBe('user_1');
    expect(verifyToken(ics, 'rsvp')).toBeNull();
    expect(verifyToken(rsvp, 'rsvp')?.userId).toBe('user_1');
    expect(verifyToken(rsvp, 'ics')).toBeNull();
  });

  it('rejects the old three-part payload', () => {
    const legacy = Buffer.from('evt_1:user_1:' + (Date.now() + 60_000), 'utf8').toString('base64url');
    const token = mintToken({ eventId: 'evt_1', userId: 'user_1', expMs: Date.now() + 60_000, purpose: 'rsvp' });
    expect(verifyToken(`${legacy}.${token.split('.')[1]}`, 'rsvp')).toBeNull();
  });

  it('rejects garbage', () => {
    expect(verifyToken('', 'rsvp')).toBeNull();
    expect(verifyToken('nodot', 'rsvp')).toBeNull();
    expect(verifyToken('a.b', 'rsvp')).toBeNull();
  });

  it('expires three days after the event starts', () => {
    const start = Date.UTC(2026, 8, 10, 19, 0, 0);
    expect(tokenExpiryFor(new Date(start).toISOString())).toBe(start + 3 * 86_400_000);
  });
});
