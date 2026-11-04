import {Agent} from 'node:https';
import dns from 'node:dns/promises';
import {BlockList,isIP} from 'node:net';

/** Browser push services only; suffixes require a dot boundary. */
export function validPushEndpoint(value:unknown):value is string {
 if(typeof value!=='string'||value.length>1024)return false;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&(!u.port||u.port==='443')&&
  (['fcm.googleapis.com','updates.push.services.mozilla.com'].includes(u.hostname)||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'));
 }catch{return false;}
}
export function validPushKeys(keys:unknown):keys is {p256dh:string;auth:string}{
 if(!keys||typeof keys!=='object')return false;
 const k=keys as Record<string,unknown>;
 return typeof k.p256dh==='string'&&/^[A-Za-z0-9_-]{87}=?$/.test(k.p256dh)&&Buffer.from(k.p256dh,'base64url').length===65&&Buffer.from(k.p256dh,'base64url')[0]===4&&
  typeof k.auth==='string'&&/^[A-Za-z0-9_-]{22}(==)?$/.test(k.auth)&&Buffer.from(k.auth,'base64url').length===16;
}
const blocked=new BlockList();
for(const [address,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]] as const)blocked.addSubnet(address,prefix,'ipv4');
for(const [address,prefix] of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8],['2001:db8::',32],['64:ff9b::',96],['64:ff9b:1::',48],['2002::',16]] as const)blocked.addSubnet(address,prefix,'ipv6');
export function publicAddress(address:string):boolean{
 const family=isIP(address);if(!family)return false;
 // Node's BlockList checks IPv4-mapped IPv6 against the IPv4 subnets too.
 return !blocked.check(address,family===4?'ipv4':'ipv6');
}
/** Resolve once and pin the checked answers to the actual TLS connection.
 * web-push uses https.request and does not follow redirects. Never use a proxy.
 */
export async function pushAgent(endpoint:string):Promise<Agent>{
 if(!validPushEndpoint(endpoint))throw Error('Unsupported push service.');
 const host=new URL(endpoint).hostname;
 let timer:ReturnType<typeof setTimeout>|undefined;
 const records=await Promise.race([dns.lookup(host,{all:true}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Push DNS timeout.')),3000);})]).finally(()=>clearTimeout(timer));
 if(!records.length||records.some(r=>!publicAddress(r.address)))throw Error('Push destination is not public.');
 return new Agent({keepAlive:false,lookup:(hostname,options,callback)=>{
  if(hostname!==host){callback(Error('Unexpected push hostname.'),[]);return;}
  if(options.all)callback(null,records);else callback(null,records[0].address,records[0].family);
 }});
}
