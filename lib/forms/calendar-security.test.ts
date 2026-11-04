import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
const mocks = vi.hoisted(() => ({ auth:vi.fn(), db:vi.fn(), configured:vi.fn(), sync:vi.fn() }));
vi.mock('@clerk/nextjs/server', () => ({auth:mocks.auth}));
vi.mock('next/cache', () => ({revalidatePath:vi.fn()}));
vi.mock('@/lib/supabase', () => ({getSupabase:mocks.db}));
vi.mock('@/lib/security/crypto', () => ({isEncryptionConfigured:mocks.configured,encryptText:vi.fn(),decryptText:vi.fn()}));
vi.mock('@/lib/dashboard/ics', () => ({validateIcsUrl:() => ({ok:true,url:'https://example.com/test.ics'})}));
vi.mock('@/lib/dashboard/sync-feed', () => ({syncFeedForUser:mocks.sync}));
vi.mock('@/lib/google/oauth', () => ({isGoogleConfigured:() => false,SCOPES:{}}));
import {connectCalendar,refreshCalendar} from '@/app/dashboard/(app)/availability/actions';
beforeEach(() => {vi.clearAllMocks();mocks.auth.mockResolvedValue({userId:null});mocks.configured.mockReturnValue(false);});
describe('calendar security boundary', () => {
  it('keeps internal sync out of the server-action module', () => {
    const action = readFileSync('app/dashboard/(app)/availability/actions.ts','utf8');
    expect(action).not.toMatch(/export\s+async\s+function\s+syncFeedForUser/);
    expect(readFileSync('lib/dashboard/sync-feed.ts','utf8')).toContain("import 'server-only'");
    for (const path of ['app/api/cron/tick/route.ts','app/dashboard/(app)/lead/actions.ts']) expect(readFileSync(path,'utf8')).toContain("from '@/lib/dashboard/sync-feed'");
  });
  it('refuses signed-out connect and refresh without touching data', async () => {
    expect((await connectCalendar('https://example.com/test.ics','UTC')).ok).toBe(false);
    expect((await refreshCalendar('UTC')).ok).toBe(false);
    expect(mocks.db).not.toHaveBeenCalled();expect(mocks.sync).not.toHaveBeenCalled();
  });
  it('refuses new plaintext calendar storage when encryption is absent', async () => {
    mocks.auth.mockResolvedValue({userId:'synthetic-user'});
    expect(await connectCalendar('https://example.com/test.ics','UTC')).toMatchObject({ok:false,error:'Secure calendar storage is unavailable. Please try later.'});
    expect(mocks.sync).not.toHaveBeenCalled();
  });
});
