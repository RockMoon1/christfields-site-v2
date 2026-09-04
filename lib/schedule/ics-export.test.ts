import { describe, expect, it } from 'vitest';
import { buildEventIcs, buildFeedIcs, googleTemplateUrl, icsUtc } from './ics-export';
import type { MemberEvent } from './public-event';

const BASE = 'https://christfields2717.com';

const event: MemberEvent = {
  id: 'evt_1',
  orgId: 'org_1',
  orgName: 'Iron and Ember',
  title: 'Rock climbing; bring chalk, water',
  type: 'outing',
  startsAt: '2026-09-11T01:00:00.000Z',
  endsAt: null,
  tz: 'America/Denver',
  location: 'Movement Gym',
  description: 'Line one\nLine two',
  memberNote: 'Ask who talked them into this.',
  status: 'scheduled',
  cancelReason: '',
  cancelledAt: null,
  version: 2,
  seriesId: null,
  ridesEnabled: false,
  scriptureRef: "",
  scriptureText: "",
  scriptureWhy: "",
  discussion: "",
};

describe('ics export', () => {
  it('formats UTC stamps', () => {
    expect(icsUtc('2026-09-11T01:00:00.000Z')).toBe('20260911T010000Z');
  });

  it('writes a stable UID, the version as SEQUENCE, and a 90-minute default end', () => {
    const ics = buildEventIcs(event, BASE, '2026-09-01T00:00:00.000Z');
    expect(ics).toContain('UID:evt_1@christfields2717.com');
    expect(ics).toContain('SEQUENCE:2');
    expect(ics).toContain('DTSTART:20260911T010000Z');
    expect(ics).toContain('DTEND:20260911T023000Z');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('SUMMARY:Rock climbing\\; bring chalk\\, water');
    expect(ics).toContain(`URL:${BASE}/dashboard/e/evt_1`);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('marks cancelled events and never leaks leader-only fields', () => {
    const cancelled: MemberEvent = { ...event, status: 'cancelled', cancelReason: 'Snow', version: 3 };
    const ics = buildEventIcs(cancelled, BASE);
    expect(ics).toContain('STATUS:CANCELLED');
    expect(ics).toContain('SUMMARY:Called off: Rock climbing');
    expect(ics).not.toContain('leader');
    expect(ics).not.toContain('host_user_id');
  });

  it('builds a feed with one VEVENT per event', () => {
    const feed = buildFeedIcs([event, { ...event, id: 'evt_2' }], BASE);
    expect(feed.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(feed).toContain('X-WR-CALNAME:Christ Fields');
  });

  it('builds a Google template link with the event zone', () => {
    const url = new URL(googleTemplateUrl(event, BASE));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20260911T010000Z/20260911T023000Z');
    expect(url.searchParams.get('ctz')).toBe('America/Denver');
    expect(url.searchParams.get('location')).toBe('Movement Gym');
  });
});
