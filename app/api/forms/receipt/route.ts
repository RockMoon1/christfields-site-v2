import {createHash,createHmac} from 'node:crypto';
import {NextResponse} from 'next/server';
import {getSupabase} from '@/lib/supabase';
import {takeRateLimit} from '@/lib/rate-limit';
export const dynamic='force-dynamic';
const reply=(status:number,body:object)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
export async function POST(req:Request){
 const origin=process.env.NODE_ENV==='development'?new URL(req.url).origin:'https://christfields2717.com';
 if(req.headers.get('origin')!==origin||req.headers.get('sec-fetch-site')==='cross-site')return reply(403,{error:'Use this website.'});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply(415,{error:'Invalid request.'});
 try{
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!secret)return reply(503,{error:'Unavailable.'});
  const key=createHmac('sha256',secret).update(`receipt:${new Date().toISOString().slice(0,10)}:${req.headers.get('x-nf-client-connection-ip')||'unknown'}`).digest('hex');
  const rate=await takeRateLimit(`receipt:view:${key}`,10,600);if(!rate.durable||!rate.allowed)return reply(429,{error:'Try again later.'});
  const reader=req.body?.getReader();if(!reader)return reply(400,{error:'Missing token.'});const chunks:Uint8Array[]=[];let size=0;
  while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>200){await reader.cancel();return reply(413,{error:'Invalid request.'});}chunks.push(r.value);}
  const {token}=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))return reply(400,{error:'Invalid token.'});
  const sb=getSupabase();const {data,error}=await sb.from('activity_receipts').select('response_id').eq('token_hash',createHash('sha256').update(token).digest('hex')).gt('expires_at',new Date().toISOString()).maybeSingle();
  if(error||!data)return reply(404,{error:'This receipt link is invalid or expired.'});
  const saved=await sb.from('activity_responses').update({email_verified:true}).eq('id',data.response_id).select('id,form_slug,created_at,interest,available,unavailable').single();
  if(saved.error)return reply(503,{error:'Receipt unavailable.'});
  return reply(200,{receipt:saved.data});
 }catch{return reply(400,{error:'Receipt unavailable.'});}
}
