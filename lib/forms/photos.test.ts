import {it,expect,vi} from 'vitest';
import sharp from 'sharp';
vi.mock('server-only',()=>({}));
import {safeEventPhoto} from './photos';
it('rejects oversized, non-image and SVG payloads',async()=>{for(const bytes of [new Uint8Array(500001),Buffer.from('not an image'),Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>')])await expect(safeEventPhoto(bytes)).rejects.toThrow();});
it('re-encodes and resizes real images without preserving metadata',async()=>{const bytes=await sharp({create:{width:1600,height:1200,channels:3,background:'blue'}}).jpeg().withMetadata().toBuffer();const out=Buffer.from(await safeEventPhoto(bytes),'base64');const meta=await sharp(out).metadata();expect(meta.format).toBe('webp');expect(meta.width).toBe(1280);expect(meta.exif).toBeUndefined();expect(out.length).toBeLessThan(300000);});
