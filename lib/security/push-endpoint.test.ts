import {expect,it,vi,beforeEach} from 'vitest';
const lookup=vi.hoisted(()=>vi.fn());
vi.mock('node:dns/promises',()=>({default:{lookup}}));
import {validPushEndpoint,publicAddress,pushAgent} from './push-endpoint';
beforeEach(()=>vi.clearAllMocks());
it('accepts supported services but not lookalikes, credentials or custom ports',()=>{
 for(const url of ['https://fcm.googleapis.com/fcm/send/test','https://updates.push.services.mozilla.com/wpush/v2/test','https://web.push.apple.com/test','https://wns2.notify.windows.com/test'])expect(validPushEndpoint(url)).toBe(true);
 for(const url of ['https://127.0.0.1/test','https://fcm.googleapis.com.evil.example/test','https://evilnotify.windows.com/test','https://fcm.googleapis.com:8443/test','https://u:p@fcm.googleapis.com/test','http://fcm.googleapis.com/test'])expect(validPushEndpoint(url)).toBe(false);
});
it('rejects private and mapped addresses including metadata, multicast and loopback',()=>{
 for(const ip of ['127.0.0.1','169.254.169.254','10.0.0.1','192.168.1.1','100.64.1.1','224.0.0.1','::1','::ffff:127.0.0.1','::ffff:7f00:1','fe90::1','fc00::1','64:ff9b::a00:1'])expect(publicAddress(ip),ip).toBe(false);
 expect(publicAddress('142.250.1.1')).toBe(true);expect(publicAddress('2606:4700:4700::1111')).toBe(true);
});
it('refuses mixed public/private DNS results before any socket is created',async()=>{
 lookup.mockResolvedValue([{address:'142.250.1.1',family:4},{address:'127.0.0.1',family:4}]);
 await expect(pushAgent('https://fcm.googleapis.com/test')).rejects.toThrow('not public');
});
it('pins approved answers instead of resolving again at connection time',async()=>{
 lookup.mockResolvedValue([{address:'142.250.1.1',family:4}]);const agent=await pushAgent('https://fcm.googleapis.com/test');
 lookup.mockResolvedValue([{address:'127.0.0.1',family:4}]);
 const cb=vi.fn();agent.options.lookup!('fcm.googleapis.com',{all:true},cb);
 expect(cb).toHaveBeenCalledWith(null,[{address:'142.250.1.1',family:4}]);expect(lookup).toHaveBeenCalledOnce();agent.destroy();
});
