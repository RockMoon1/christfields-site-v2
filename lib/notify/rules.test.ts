import { describe, it, expect } from 'vitest';
import {
  isQuietHour,
  isLiveSub,
  orderByAnswer,
  dedupeKey,
  countsTowardCeiling,
  changedTier,
  emailWindowStartIso,
  localHour,
  safeTz,
  TIER_LIMITS,
} from './rules';

const DENVER = 'America/Denver';
// 2026-09-10 03:00:00Z = 2026-09-09 21:00 in Denver (MDT, UTC-6)
const NINE_PM_DENVER = Date.UTC(2026, 8, 10, 3, 0, 0);
const NOON_DENVER = Date.UTC(2026, 8, 10, 18, 0, 0);
const SIX_AM_DENVER = Date.UTC(2026, 8, 10, 12, 0, 0);
const SEVEN_AM_DENVER = Date.UTC(2026, 8, 10, 13, 0, 0);

describe('quiet hours', () => {
  it('starts at 21:00 local', () => {
    expect(localHour(NINE_PM_DENVER, DENVER)).toBe(21);
    expect(isQuietHour(NINE_PM_DENVER, DENVER)).toBe(true);
  });
  it('ends at 07:00 local', () => {
    expect(isQuietHour(SIX_AM_DENVER, DENVER)).toBe(true);
    expect(isQuietHour(SEVEN_AM_DENVER, DENVER)).toBe(false);
  });
  it('is not quiet at noon', () => {
    expect(isQuietHour(NOON_DENVER, DENVER)).toBe(false);
  });
  it('falls back to UTC for an unknown zone', () => {
    expect(safeTz('Mars/Olympus', DENVER)).toBe(DENVER);
    expect(safeTz('UTC', DENVER)).toBe(DENVER);
    expect(safeTz('Europe/London', DENVER)).toBe('Europe/London');
  });
});

describe('push liveness', () => {
  const now = Date.UTC(2026, 8, 10);
  it('is live within 14 days with no failures', () => {
    expect(isLiveSub({ fail_count: 0, last_ok_at: new Date(now - 13 * 86_400_000).toISOString() }, now)).toBe(true);
  });
  it('is dead after 14 days or any failure or no ack', () => {
    expect(isLiveSub({ fail_count: 0, last_ok_at: new Date(now - 15 * 86_400_000).toISOString() }, now)).toBe(false);
    expect(isLiveSub({ fail_count: 1, last_ok_at: new Date(now).toISOString() }, now)).toBe(false);
    expect(isLiveSub({ fail_count: 0, last_ok_at: null }, now)).toBe(false);
  });
});

describe('recipient order', () => {
  it('goes going, maybe, silent, declined', () => {
    const people = [
      { id: 'a', a: 'not_going' as const },
      { id: 'b', a: 'none' as const },
      { id: 'c', a: 'going' as const },
      { id: 'd', a: 'maybe' as const },
    ];
    expect(orderByAnswer(people, (p) => p.a).map((p) => p.id)).toEqual(['c', 'd', 'b', 'a']);
  });
});

describe('dedupe keys and ceilings', () => {
  it('builds keys with an optional discriminator', () => {
    expect(dedupeKey('ev1', 'created')).toBe('ev1:created');
    expect(dedupeKey('ev1', 'changed', 3)).toBe('ev1:changed:3');
  });
  it('counts only reminders and nudges toward the daily ceiling', () => {
    expect(countsTowardCeiling('ev1:reminder_24h')).toBe(true);
    expect(countsTowardCeiling('ev1:reminder_2h')).toBe(true);
    expect(countsTowardCeiling('ev1:nudge')).toBe(true);
    expect(countsTowardCeiling('ev1:created')).toBe(false);
    expect(countsTowardCeiling('ev1:cancelled')).toBe(false);
    expect(countsTowardCeiling('ev1:changed:2')).toBe(false);
  });
});

describe('email tiers', () => {
  it('keeps the app under the shared daily cap', () => {
    expect(TIER_LIMITS.urgent).toBeLessThanOrEqual(80);
    expect(TIER_LIMITS.reminder).toBeLessThan(TIER_LIMITS.urgent);
    expect(TIER_LIMITS.info).toBeLessThan(TIER_LIMITS.reminder);
  });
  it('treats same-day moves as urgent', () => {
    const now = Date.UTC(2026, 8, 10, 12);
    expect(changedTier(now + 3 * 3_600_000, now)).toBe('urgent');
    expect(changedTier(now + 48 * 3_600_000, now)).toBe('info');
  });
  it('matches the SQL fixed window for a one-day bucket', () => {
    const now = Date.UTC(2026, 8, 10, 17, 45);
    expect(emailWindowStartIso(now)).toBe('2026-09-10T00:00:00.000Z');
  });
});
