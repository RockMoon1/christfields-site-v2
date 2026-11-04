import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({rate:vi.fn(),insert:vi.fn(),send:vi.fn(),update:vi.fn()}));
vi.mock('@/lib/rate-limit',()=>({takeRateLimit:m.rate}));
vi.mock('@/lib/supabase',()=>({getSupabase:()=>({from:()=>({insert:m.insert,update:()=>({eq:m.update})})})}));
vi.mock('resend',()=>({Resend:class{emails={send:m.send}}}));
import {POST} from '@/app/api/submit/route';
const valid={name:'Synthetic <test>',email:'synthetic@example.com',message:'Synthetic message',formName:'faithflow'};
function req(body:unknown=valid,headers:Record<string,string>={}){return new Request('https://internal.example/api/submit',{method:'POST',headers:{origin:'https://christfields2717.com','content-type':'application/json',...headers},body:JSON.stringify(body)});}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only');vi.stubEnv('RESEND_API_KEY','test-only');m.rate.mockResolvedValue({durable:true,allowed:true});m.insert.mockReturnValue({select:()=>({single:async()=>({data:{id:'synthetic'},error:null})})});m.send.mockResolvedValue({error:null});});
afterEach(()=>vi.unstubAllEnvs());
it('rejects forged browser origins and wrong media type before consuming quota',async()=>{
 expect((await POST(req(valid,{origin:'https://evil.example'}))).status).toBe(403);
 expect((await POST(req(valid,{'content-type':'text/plain'}))).status).toBe(415);expect(m.rate).not.toHaveBeenCalled();
});
it('fails closed on missing shared protection and rejects throttled IP before reading',async()=>{
 m.rate.mockResolvedValue({durable:false,allowed:true});expect((await POST(req())).status).toBe(503);
 m.rate.mockResolvedValue({durable:true,allowed:false});expect((await POST(req())).status).toBe(429);expect(m.insert).not.toHaveBeenCalled();expect(m.send).not.toHaveBeenCalled();
});
it('oversized chunked and invalid inputs cannot consume the global budget',async()=>{
 expect((await POST(req({...valid,message:'x'.repeat(17000)}))).status).toBe(413);
 expect((await POST(req({...valid,name:{bad:true}}))).status).toBe(400);
 expect((await POST(req({...valid,name:'bad\r\nheader'}))).status).toBe(400);
 expect(m.rate.mock.calls.every(([key])=>key.startsWith('submit:ip:'))).toBe(true);expect(m.send).not.toHaveBeenCalled();
});
it('global limit blocks storage and mail only after IP and field validation',async()=>{
 m.rate.mockImplementation(async key=>({durable:true,allowed:key!=='submit:global'}));
 expect((await POST(req())).status).toBe(429);expect(m.insert).not.toHaveBeenCalled();expect(m.rate.mock.calls[1]).toEqual(['submit:global',100,3600]);
});
it('saves a real-shaped submission and sends only fixed content to the unverified recipient',async()=>{
 expect((await POST(req())).status).toBe(200);expect(m.insert).toHaveBeenCalledOnce();expect(m.send).toHaveBeenCalledTimes(2);
 const reply=m.send.mock.calls[1][0];expect(reply.to).toBe(valid.email);expect(reply.text).not.toContain(valid.name);expect(reply.text).not.toContain(valid.message);expect(reply.text).toContain('If it was not you');
 expect(m.rate.mock.calls[2][0]).toMatch(/^submit:recipient:[a-f0-9]{64}$/);expect(m.rate.mock.calls[0][0]).not.toContain('unknown');
});
it('a recipient limit skips the reply without losing the stored message',async()=>{
 m.rate.mockImplementation(async key=>({durable:true,allowed:!key.startsWith('submit:recipient:')}));
 expect((await POST(req())).status).toBe(200);expect(m.insert).toHaveBeenCalledOnce();expect(m.send).toHaveBeenCalledOnce();
});
