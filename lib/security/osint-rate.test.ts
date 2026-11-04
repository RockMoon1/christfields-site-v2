import {beforeEach,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({rate:vi.fn(),check:vi.fn()}));
vi.mock('@/lib/rate-limit',()=>({takeRateLimit:m.rate}));
vi.mock('@/lib/osint-control/store',()=>({checkInDevice:m.check,OsintControlNotConfigured:class extends Error{},OsintControlPublicError:class extends Error{}}));
import {POST} from '@/app/api/osint-control/check-in/route';
beforeEach(()=>{vi.clearAllMocks();m.rate.mockResolvedValue({durable:true,allowed:false});});
it('rotating caller-controlled device IDs cannot reset the network limit',async()=>{
 for(const deviceId of ['one','two']){const r=new Request('https://christfields2717.com/api/osint-control/check-in',{method:'POST',headers:{'x-nf-client-connection-ip':'192.0.2.1'},body:JSON.stringify({deviceId})});expect((await POST(r)).status).toBe(429);}
 expect(m.rate.mock.calls).toEqual([['osint-check:192.0.2.1',60,600],['osint-check:192.0.2.1',60,600]]);expect(m.check).not.toHaveBeenCalled();
});
it('backend failure prevents credential checks',async()=>{
 m.rate.mockResolvedValue({durable:false,allowed:true});expect((await POST(new Request('https://christfields2717.com/api/osint-control/check-in',{method:'POST',body:'{}'}))).status).toBe(503);expect(m.check).not.toHaveBeenCalled();
});
