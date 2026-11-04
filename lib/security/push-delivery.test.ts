import {it,expect,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {PushSubscriptionRow} from '@/lib/supabase';
const m=vi.hoisted(()=>({agent:vi.fn(),send:vi.fn()}));
vi.mock('@/lib/security/push-endpoint',()=>({pushAgent:m.agent}));
vi.mock('web-push',()=>({default:{setVapidDetails:vi.fn(),sendNotification:m.send}}));
import {pushToSubs} from '@/lib/notify/push';
it('blocks legacy unsafe rows at delivery and uses the checked agent for safe rows',async()=>{
 vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY','test-only');vi.stubEnv('VAPID_PRIVATE_KEY','test-only');
 const agent={destroy:vi.fn()};m.agent.mockRejectedValueOnce(Error('blocked')).mockResolvedValueOnce(agent);m.send.mockResolvedValue({});
 const update=vi.fn().mockReturnValue({in:vi.fn()});const sb={from:()=>({update})} as unknown as SupabaseClient;
 const rows=[{id:'bad',endpoint:'https://127.0.0.1',clerk_user_id:'test',fail_count:0},{id:'good',endpoint:'https://fcm.googleapis.com/test',clerk_user_id:'test',fail_count:0}] as PushSubscriptionRow[];
 const out=await pushToSubs(sb,rows,{title:'Synthetic',body:'Test',url:'/dashboard',tag:'test'},{urgency:'normal',ttlSeconds:60});
 expect(m.send).toHaveBeenCalledOnce();expect(m.send.mock.calls[0][2].agent).toBe(agent);expect(agent.destroy).toHaveBeenCalledOnce();expect(out).toMatchObject({sent:1,failed:1,removed:0});vi.unstubAllEnvs();
});
