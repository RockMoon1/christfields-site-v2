import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const lookup=vi.hoisted(()=>vi.fn());
vi.mock('node:dns/promises',()=>({default:{lookup}}));
import {fetchBusySlots,validateIcsUrl} from '@/lib/dashboard/ics';
const fetcher=vi.fn();
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('fetch',fetcher);lookup.mockResolvedValue([{address:'142.250.1.1',family:4}]);vi.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const run=()=>fetchBusySlots('https://calendar.google.com/synthetic.ics','UTC',Date.UTC(2026,10,4),Date.UTC(2026,10,5));
it('rejects credential-bearing, custom-port and internal links',()=>{
 for(const url of ['https://user:pass@calendar.google.com/x','https://calendar.google.com:8443/x','https://127.0.0.1/x','https://calendar.google.com.evil.example/x'])expect(validateIcsUrl(url).ok).toBe(false);
 expect(validateIcsUrl('webcal://p01-caldav.icloud.com/synthetic').ok).toBe(true);
});
it('cancels oversized upstream streams and never parses a truncated calendar',async()=>{
 const cancel=vi.fn();fetcher.mockResolvedValue(new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(2_000_001));},cancel})));
 expect((await run()).ok).toBe(false);expect(cancel).toHaveBeenCalledOnce();
});
it('revalidates redirects before fetching the next target',async()=>{
 fetcher.mockResolvedValue(new Response(null,{status:302,headers:{location:'https://169.254.169.254/latest/meta-data'}}));
 expect((await run()).ok).toBe(false);expect(fetcher).toHaveBeenCalledOnce();
});
it('rejects private DNS answers before fetch',async()=>{
 lookup.mockResolvedValue([{address:'127.0.0.1',family:4}]);expect((await run()).ok).toBe(false);expect(fetcher).not.toHaveBeenCalled();
});
it('does not log upstream errors that contain bearer URLs',async()=>{
 fetcher.mockRejectedValue(new Error('https://calendar.google.com/private-secret-token'));
 expect((await run()).ok).toBe(false);expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private-secret-token');
});
it('accepts a small valid empty calendar',async()=>{
 fetcher.mockResolvedValue(new Response('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR'));
 expect(await run()).toMatchObject({ok:true,slots:[]});
});
