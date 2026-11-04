import {beforeEach,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({auth:vi.fn(),db:vi.fn(),rate:vi.fn()}));
vi.mock('@clerk/nextjs/server',()=>({auth:m.auth}));
vi.mock('@/lib/supabase',()=>({getSupabase:m.db}));
vi.mock('@/lib/rate-limit',()=>({takeRateLimit:m.rate}));
import {POST as subscribe} from '@/app/api/push/subscribe/route';
import {POST as rotate} from '@/app/api/push/rotate/route';
const keys={p256dh:Buffer.concat([Buffer.from([4]),Buffer.alloc(64,1)]).toString('base64url'),auth:Buffer.alloc(16,1).toString('base64url')};
const request=(body:unknown)=>new Request('https://christfields2717.com/api/push/subscribe',{method:'POST',body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();m.auth.mockResolvedValue({userId:'synthetic-user'});m.rate.mockResolvedValue({durable:true,allowed:true});});
it('does not touch data for signed-out registration',async()=>{
 m.auth.mockResolvedValue({userId:null});expect((await subscribe(request({}))).status).toBe(401);expect(m.db).not.toHaveBeenCalled();
});
it('registration and rotation reject arbitrary HTTPS endpoints and bad keys',async()=>{
 for(const endpoint of ['https://127.0.0.1/path','https://attacker.example/path']){
  expect((await subscribe(request({subscription:{endpoint,keys}}))).status).toBe(400);
  expect((await rotate(request({oldEndpoint:'https://fcm.googleapis.com/old',subscription:{endpoint,keys}}))).status).toBe(400);
 }
 expect((await subscribe(request({subscription:{endpoint:'https://fcm.googleapis.com/test',keys:{auth:'bad',p256dh:'bad'}}}))).status).toBe(400);expect(m.db).not.toHaveBeenCalled();
});
it('rejects oversized bodies and null rotation safely',async()=>{
 expect((await subscribe(request({padding:'x'.repeat(9000)}))).status).toBe(400);
 expect((await rotate(request(null))).status).toBe(400);expect(m.db).not.toHaveBeenCalled();
});
it('cannot write push subscriptions when durable throttling is unavailable',async()=>{
 m.rate.mockResolvedValue({durable:false,allowed:true});expect((await subscribe(request({}))).status).toBe(503);expect((await rotate(request({}))).status).toBe(429);expect(m.db).not.toHaveBeenCalled();
});
