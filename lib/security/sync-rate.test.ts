import {it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({rate:vi.fn(),fetch:vi.fn(),db:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('@/lib/rate-limit',()=>({takeRateLimit:m.rate}));
vi.mock('@/lib/dashboard/ics',()=>({fetchBusySlots:m.fetch}));vi.mock('@/lib/supabase',()=>({getSupabase:m.db}));
import {syncFeedForUser} from '@/lib/dashboard/sync-feed';
it('shared calendar cooldown stops download and preserves saved data',async()=>{
 for(const rate of [{durable:true,allowed:false},{durable:false,allowed:true}]){
  m.rate.mockResolvedValue(rate);expect((await syncFeedForUser('synthetic-user','https://calendar.google.com/test','UTC')).ok).toBe(false);
 }
 expect(m.fetch).not.toHaveBeenCalled();expect(m.db).not.toHaveBeenCalled();expect(m.rate).toHaveBeenCalledWith('calendar-sync:synthetic-user',2,60);
});
