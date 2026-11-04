import { expect, it, vi, beforeEach } from 'vitest';
const user = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('@clerk/nextjs/server', () => ({ currentUser: user }));
vi.mock('@/lib/supabase', () => ({ getSupabase: vi.fn() }));
import { isFormsOrganizer } from './server';
beforeEach(() => vi.clearAllMocks());
it('requires a verified organizer identity, not merely a session or claimed address', async () => {
  user.mockResolvedValue(null); expect(await isFormsOrganizer()).toBe(false);
  user.mockResolvedValue({emailAddresses:[{emailAddress:'stranger@example.com',verification:{status:'verified'}}]}); expect(await isFormsOrganizer()).toBe(false);
  user.mockResolvedValue({emailAddresses:[{emailAddress:'proverbs@christfields2717.com',verification:{status:'unverified'}}]}); expect(await isFormsOrganizer()).toBe(false);
  user.mockResolvedValue({emailAddresses:[{emailAddress:'lpellow05@gmail.com',verification:{status:'verified'}}]}); expect(await isFormsOrganizer()).toBe(true);
});
