import { describe, expect, it } from 'vitest';
import { isOsintAdminConfigured, isOsintAdminMatch, osintAdminAllowlists, parseCsvAllowlist } from './admin';

describe('OSINT control admin allowlist helpers', () => {
  it('normalizes comma-separated IDs and emails', () => {
    expect([...parseCsvAllowlist(' User_1, admin@example.com , ')].sort()).toEqual(['admin@example.com', 'user_1']);
  });

  it('requires an explicit configured allowlist', () => {
    expect(isOsintAdminConfigured(osintAdminAllowlists({}))).toBe(false);
    expect(isOsintAdminConfigured(osintAdminAllowlists({ OSINT_CONTROL_ADMIN_EMAILS: 'owner@example.com' }))).toBe(true);
  });

  it('matches by user ID or verified email', () => {
    const allowlists = osintAdminAllowlists({
      OSINT_CONTROL_ADMIN_USER_IDS: 'user_admin',
      OSINT_CONTROL_ADMIN_EMAILS: 'owner@example.com',
    });
    expect(isOsintAdminMatch({ userId: 'user_admin', emails: [] }, allowlists)).toBe(true);
    expect(isOsintAdminMatch({ userId: 'user_other', emails: ['owner@example.com'] }, allowlists)).toBe(true);
    expect(isOsintAdminMatch({ userId: 'user_other', emails: ['helper@example.com'] }, allowlists)).toBe(false);
  });
});
