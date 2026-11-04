import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rate: vi.fn(), rpc: vi.fn(), send: vi.fn(), update: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ takeRateLimit: mocks.rate }));
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ rpc: mocks.rpc, from: () => ({update: () => ({eq: () => ({eq: mocks.update})})}) }) }));
vi.mock('resend', () => ({ Resend: class { emails = {send: mocks.send}; } }));
import { POST } from '@/app/api/forms/availability/route';
const answer = { submissionId: '672bfda3-0048-4bc6-a612-bbca7b284e86', name: 'Synthetic test', interest:'yes', available:['2026-11-07'], unavailable:[], notes:'', consent:true, ageConfirmed:true };
function req(body: unknown = answer, headers: Record<string,string> = {}) { return new Request('https://christfields2717.com/api/forms/availability', {method:'POST',headers:{'content-type':'application/json',...headers}, body:JSON.stringify(body)}); }
beforeEach(() => { vi.clearAllMocks(); process.env.SUPABASE_SERVICE_ROLE_KEY='test-only'; process.env.RESEND_API_KEY='test-only'; mocks.rate.mockResolvedValue({durable:true,allowed:true}); mocks.rpc.mockResolvedValue({data:'created',error:null}); mocks.send.mockResolvedValue({error:null}); mocks.update.mockResolvedValue({error:null}); });
describe('public submission boundary (mocked providers; no real email)', () => {
  it('accepts the canonical browser origin behind the hosting adapter', async () => {
    const request = new Request('https://internal-function.example/api/forms/availability', {method:'POST',headers:{'content-type':'application/json',origin:'https://christfields2717.com'},body:JSON.stringify(answer)});
    expect((await POST(request)).status).toBe(200);
  });
  it('rejects cross-origin, bad content type and oversize bodies before database access', async () => {
    expect((await POST(req(answer,{origin:'https://evil.example'}))).status).toBe(403);
    expect((await POST(req(answer,{'content-type':'text/plain'}))).status).toBe(415);
    expect((await POST(req(answer,{'content-length':'12001'}))).status).toBe(413);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('fails closed when durable rate limiting is unavailable or exhausted', async () => {
    mocks.rate.mockResolvedValue({durable:false,allowed:true}); expect((await POST(req())).status).toBe(503);
    mocks.rate.mockResolvedValue({durable:true,allowed:false}); expect((await POST(req())).status).toBe(429);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects actual oversized streamed content and invalid choices', async () => {
    expect((await POST(req({notes:'x'.repeat(12001)}))).status).toBe(413);
    expect((await POST(req({...answer,available:['2026-11-31']}))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('does not spend the global budget for repeated requests from a throttled IP', async () => {
    mocks.rate.mockImplementation(async (bucket: string) => ({durable:true,allowed:bucket === 'forms:global'}));
    for (let i=0;i<12;i++) expect((await POST(req())).status).toBe(429);
    expect(mocks.rate).toHaveBeenCalledTimes(12);
    expect(mocks.rate.mock.calls.every(([bucket]) => bucket.startsWith('forms:ip:'))).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });
  it('charges invalid JSON, honeypots, oversize streams and invalid answers only to the IP', async () => {
    const malformed = new Request('https://christfields2717.com/api/forms/availability', {method:'POST',headers:{'content-type':'application/json'},body:'{'});
    expect((await POST(malformed)).status).toBe(400);
    expect((await POST(req({...answer,website:'bot.example'}))).status).toBe(400);
    expect((await POST(req({notes:'x'.repeat(12001)}))).status).toBe(413);
    expect((await POST(req({...answer,available:['2026-11-31']}))).status).toBe(400);
    expect(mocks.rate).toHaveBeenCalledTimes(4);
    expect(mocks.rate.mock.calls.every(([bucket]) => bucket.startsWith('forms:ip:'))).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });
  it('still fails closed at the global limit after IP and validation pass', async () => {
    for (const global of [{durable:false,allowed:true},{durable:true,allowed:false}]) {
      mocks.rate.mockClear();
      mocks.rate.mockImplementation(async (bucket: string) => bucket === 'forms:global' ? global : {durable:true,allowed:true});
      expect((await POST(req())).status).toBe(global.durable ? 429 : 503);
      expect(mocks.rate.mock.calls[0][0]).toMatch(/^forms:ip:/);
      expect(mocks.rate.mock.calls[1]).toEqual(['forms:global',100,3600]);
    }
    expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });
  it('charges a valid request to the IP and then the global budget before saving', async () => {
    expect((await POST(req())).status).toBe(200);
    expect(mocks.rate.mock.calls.map(([bucket]) => bucket === 'forms:global' ? 'global' : 'ip')).toEqual(['ip','global']);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('rejects closed and conflicting responses without sending', async () => {
    mocks.rpc.mockResolvedValue({data:'closed'}); expect((await POST(req())).status).toBe(410);
    mocks.rpc.mockResolvedValue({data:'conflict'}); expect((await POST(req())).status).toBe(409);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('keeps saved responses successful on email failure and never emails retries', async () => {
    mocks.send.mockResolvedValue({error:{name:'mock error'}});
    expect(await (await POST(req())).json()).toEqual({ok:true,saved:true,emailed:false});
    expect(mocks.send).toHaveBeenCalledTimes(1);
    mocks.rpc.mockResolvedValue({data:'duplicate'}); expect((await POST(req())).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it('does not send email when saving fails', async () => {
    mocks.rpc.mockResolvedValue({error:{code:'mock'}}); expect((await POST(req())).status).toBe(503); expect(mocks.send).not.toHaveBeenCalled();
  });
});
