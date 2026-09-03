import { beforeAll, describe, expect, it } from 'vitest';
import { mintToken, verifyToken, tokenExpiryFor } from './tokens';

describe('one-tap answer tokens', () => {
  beforeAll(() => {
    process.env.APP_TOKEN_SECRET = 'test-secret-that-is-long-enough-123456';
  });

  it('round-trips valid claims', () => {
    const exp = Date.now() + 60_000;
    const token = mintToken({ eventId: 'evt_1', userId: 'user_1', expMs: exp });
    const claims = verifyToken(token);
    expect(claims).toEqual({ eventId: 'evt_1', userId: 'user_1', expMs: Math.floor(exp) });
  });

  it('rejects an expired token', () => {
    const token = mintToken({ eventId: 'evt_1', userId: 'user_1', expMs: Date.now() - 1 });
    expect(verifyToken(token)).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = mintToken({ eventId: 'evt_1', userId: 'user_1', expMs: Date.now() + 60_000 });
    const [payload, sig] = token.split('.');
    const forged = Buffer.from('evt_1:user_2:' + (Date.now() + 60_000), 'utf8').toString('base64url');
    expect(verifyToken(`${forged}.${sig}`)).toBeNull();
    expect(verifyToken(`${payload}.${sig.slice(0, -2)}xx`)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(verifyToken('')).toBeNull();
    expect(verifyToken('nodot')).toBeNull();
    expect(verifyToken('a.b')).toBeNull();
  });

  it('expires three days after the event starts', () => {
    const start = Date.UTC(2026, 8, 10, 19, 0, 0);
    expect(tokenExpiryFor(new Date(start).toISOString())).toBe(start + 3 * 86_400_000);
  });
});
