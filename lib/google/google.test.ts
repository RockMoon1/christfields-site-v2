import { beforeAll, describe, expect, it } from 'vitest';
import { mintState, verifyState, SCOPES } from './oauth';
import { eventBody, intervalsToBusySlots } from './calendar';
import type { MemberEvent } from '@/lib/schedule/public-event';

describe('google oauth state', () => {
  beforeAll(() => {
    process.env.APP_TOKEN_SECRET = 'test-secret-that-is-long-enough-123456';
  });

  it('round-trips member, feature, and the page to return to', () => {
    const s = mintState('user_1', 'busy');
    expect(verifyState(s)).toEqual({ userId: 'user_1', feature: 'busy', from: 'settings' });
    const a = mintState('user_1', 'busy', 'availability');
    expect(verifyState(a)?.from).toBe('availability');
  });

  it('expires after ten minutes and rejects tampering', () => {
    const now = Date.UTC(2026, 8, 10, 12);
    const s = mintState('user_1', 'write', 'settings', now);
    expect(verifyState(s, now + 9 * 60_000)?.feature).toBe('write');
    expect(verifyState(s, now + 11 * 60_000)).toBeNull();
    const [payload, sig] = s.split('.');
    const forged = Buffer.from(Buffer.from(payload, 'base64url').toString('utf8').replace('user_1', 'user_2')).toString('base64url');
    expect(verifyState(`${forged}.${sig}`, now)).toBeNull();
    expect(verifyState('garbage', now)).toBeNull();
  });

  it('asks for exactly the two narrow scopes', () => {
    expect(Object.values(SCOPES)).toEqual([
      'https://www.googleapis.com/auth/calendar.app.created',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ]);
  });
});

describe('google event body', () => {
  const e: MemberEvent = {
    id: 'ev1',
    orgId: 'org_1',
    orgName: 'Iron and Ember',
    title: 'Climbing',
    type: 'outing',
    startsAt: '2026-09-10T01:00:00.000Z',
    endsAt: null,
    tz: 'America/Denver',
    location: 'Movement Gym',
    description: 'Bring shoes if you have them.',
    memberNote: 'Ask who talked them into this.',
    status: 'scheduled',
    cancelReason: '',
    cancelledAt: null,
    version: 2,
    seriesId: null,
    ridesEnabled: false,
    scriptureRef: '',
    scriptureText: '',
    scriptureWhy: '',
    discussion: '',
  };

  it('carries only member-safe fields and a 90 minute default length', () => {
    const b = eventBody(e, 'https://christfields2717.com');
    expect(b.summary).toBe('Climbing');
    expect(b.location).toBe('Movement Gym');
    expect(b.description).toContain('Bring shoes');
    expect(b.description).toContain('/dashboard/e/ev1');
    expect(b.start.timeZone).toBe('America/Denver');
    expect(Date.parse(b.end.dateTime) - Date.parse(b.start.dateTime)).toBe(90 * 60_000);
    expect(b.reminders.useDefault).toBe(false);
    expect(JSON.stringify(b)).not.toMatch(/leader|host|created_by/i);
  });
});

describe('free/busy to slots', () => {
  const tz = 'America/Denver';
  const from = Date.UTC(2026, 8, 9);
  const to = from + 3 * 86_400_000;

  it('maps a Denver evening dinner to one evening slot', () => {
    // 2026-09-09 19:30-21:00 MDT = 01:30-03:00Z on the 10th
    const rows = intervalsToBusySlots([{ start: '2026-09-10T01:30:00Z', end: '2026-09-10T03:00:00Z' }], tz, from, to);
    expect(rows).toEqual([{ date: '2026-09-09', slot: 'evening' }]);
  });

  it('spans slots and days, and ignores the middle of the night', () => {
    // 2026-09-09 10:00 MDT to 2026-09-10 13:00 MDT
    const rows = intervalsToBusySlots([{ start: '2026-09-09T16:00:00Z', end: '2026-09-10T19:00:00Z' }], tz, from, to);
    const keys = rows.map((r) => `${r.date}|${r.slot}`).sort();
    expect(keys).toEqual([
      '2026-09-09|afternoon',
      '2026-09-09|evening',
      '2026-09-09|morning',
      '2026-09-10|afternoon',
      '2026-09-10|morning',
    ]);
    const alarm = intervalsToBusySlots([{ start: '2026-09-10T08:00:00Z', end: '2026-09-10T08:30:00Z' }], tz, from, to); // 2am MDT
    expect(alarm).toEqual([]);
  });

  it('marks both slots when a short interval straddles a boundary', () => {
    // 16:30-17:15 MDT = 22:30-23:15Z: touches the afternoon and the evening.
    const rows = intervalsToBusySlots([{ start: '2026-09-09T22:30:00Z', end: '2026-09-09T23:15:00Z' }], tz, from, to);
    expect(rows.map((r) => r.slot).sort()).toEqual(['afternoon', 'evening']);
  });

  it('clips to the window and skips bad input', () => {
    const rows = intervalsToBusySlots([{ start: 'nope', end: 'nope' }, { start: '2026-09-01T16:00:00Z', end: '2026-09-01T17:00:00Z' }], tz, from, to);
    expect(rows).toEqual([]);
  });
});
