import {beforeEach,it,expect,vi} from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/supabase',()=>({getSupabase:()=>({rpc})}));
import {takeRateLimit} from '@/lib/rate-limit';
beforeEach(()=>vi.clearAllMocks());
it('fails closed on backend errors, malformed counters and exceptions',async()=>{
 for(const result of [{data:null,error:{}},{data:'1',error:null}]){rpc.mockResolvedValue(result);expect(await takeRateLimit('synthetic',5,60)).toEqual({allowed:false,durable:false});}
 rpc.mockRejectedValue(Error('unavailable'));expect(await takeRateLimit('synthetic',5,60)).toEqual({allowed:false,durable:false});
});
it('enforces the returned atomic count',async()=>{
 rpc.mockResolvedValue({data:5,error:null});expect(await takeRateLimit('synthetic',5,60)).toEqual({allowed:true,durable:true});
 rpc.mockResolvedValue({data:6,error:null});expect(await takeRateLimit('synthetic',5,60)).toEqual({allowed:false,durable:true});
});
