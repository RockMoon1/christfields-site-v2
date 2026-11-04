import {expect,it,vi} from 'vitest';
import {boundedText,BodyTooLarge} from './body';
it('enforces bytes across chunks and cancels instead of consuming the remainder',async()=>{
 const cancel=vi.fn();let reads=0;
 const body=new ReadableStream<Uint8Array>({pull(c){reads++;c.enqueue(new Uint8Array(6));},cancel},{highWaterMark:0});
 await expect(boundedText(body,10)).rejects.toBeInstanceOf(BodyTooLarge);
 expect(cancel).toHaveBeenCalledOnce();expect(reads).toBe(2);
});
it('preserves UTF-8 split across chunks at the limit',async()=>{
 const bytes=new TextEncoder().encode('aé');
 const body=new ReadableStream<Uint8Array>({start(c){c.enqueue(bytes.slice(0,2));c.enqueue(bytes.slice(2));c.close();}});
 expect(await boundedText(body,3)).toBe('aé');
});
