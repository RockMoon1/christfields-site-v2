import { describe, expect, it } from 'vitest';
import { toMemberEvent, toFaces } from './public-event';
import type { EventRow } from '@/lib/supabase';

const row: EventRow = {
  id: 'evt_1',
  org_id: 'org_1',
  created_by: 'user_leader',
  title: 'Meal',
  description: 'Bring an appetite',
  event_type: 'meal',
  location: 'The Pellow house',
  starts_at: '2026-09-11T01:00:00.000Z',
  ends_at: null,
  created_at: '2026-09-01T00:00:00.000Z',
  status: 'scheduled',
  cancelled_at: null,
  cancel_reason: 'should not show while scheduled',
  updated_at: '2026-09-01T00:00:00.000Z',
  version: 0,
  tz: 'America/Denver',
  series_id: null,
  member_note: 'Ask someone what they cooked.',
  leader_note: 'SECRET leader prep',
  thanks_note: 'SECRET thanks draft',
  rides_enabled: true,
  host_user_id: 'user_host',
  scripture_ref: 'Romans 12:1-2',
  scripture_text: '',
  scripture_why: 'Living sacrifice',
  discussion: 'What stands out?',
  context_notes: 'LEADER ONLY: written to Rome around AD 57',
};

describe('member-facing event allowlist', () => {
  it('carries only member-visible fields', () => {
    const e = toMemberEvent(row, 'Iron and Ember');
    const json = JSON.stringify(e);
    expect(e.title).toBe('Meal');
    expect(e.memberNote).toBe('Ask someone what they cooked.');
    expect(e.orgName).toBe('Iron and Ember');
    expect(json).not.toContain('SECRET');
    expect(json).not.toContain('user_leader');
    expect(json).not.toContain('user_host');
    expect(json).not.toContain('LEADER ONLY');
    expect(e.scriptureRef).toBe('Romans 12:1-2');
    expect(e.scriptureWhy).toBe('Living sacrifice');
    expect(e.cancelReason).toBe('');
  });

  it('exposes the reason only once cancelled', () => {
    const e = toMemberEvent({ ...row, status: 'cancelled', cancelled_at: '2026-09-02T00:00:00.000Z', cancel_reason: 'Snow' }, 'x');
    expect(e.status).toBe('cancelled');
    expect(e.cancelReason).toBe('Snow');
  });

  it('drops declines and ids from the face pile', () => {
    const faces = toFaces([
      { status: 'going', display_name: 'Sam', image_url: '' },
      { status: 'maybe', display_name: 'Priya', image_url: 'https://img/p.png' },
      { status: 'not_going', display_name: 'Jo', image_url: '' },
    ]);
    expect(faces).toHaveLength(2);
    expect(faces.map((f) => f.displayName)).toEqual(['Sam', 'Priya']);
    expect(JSON.stringify(faces)).not.toContain('Jo');
  });
});
