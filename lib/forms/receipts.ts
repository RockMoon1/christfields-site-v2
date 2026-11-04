import 'server-only';
import {randomBytes,createHash,createHmac} from 'node:crypto';
import {Resend} from 'resend';
import {getSupabase} from '@/lib/supabase';
import {takeRateLimit} from '@/lib/rate-limit';
// Unverified addresses receive only a fixed verification notice, never answers,
// names, event content or organizer-provided text. One request/address/day.
export async function requestReceipt(id:string,email:string):Promise<string>{
 const sb=getSupabase(); let status='failed';
 try {
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret||!process.env.RESEND_API_KEY)throw Error('Unavailable');
  const key=createHmac('sha256',secret).update(email).digest('hex');
  const recipient=await takeRateLimit(`receipt:address:${key}`,1,86400);
  if(!recipient.durable||!recipient.allowed){status='rate_limited';throw Error('Limited');}
  const global=await takeRateLimit('receipt:global',20,3600);
  if(!global.durable||!global.allowed){status='rate_limited';throw Error('Limited');}
  const token=randomBytes(32).toString('hex');
  const {error}=await sb.from('activity_receipts').insert({response_id:id,token_hash:createHash('sha256').update(token).digest('hex'),expires_at:new Date(Date.now()+86400000).toISOString()});
  if(error)throw Error('Unavailable');
  const sent=await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.FROM_EMAIL||'Christ Fields <proverbs@christfields2717.com>',to:email,subject:'Confirm your Christ Fields receipt request',text:`Someone requested an activity response receipt using this email address. If that was you, open this link within 24 hours and confirm to view your saved receipt:\nhttps://christfields2717.com/forms/receipt#${token}\n\nIf you did not request this, ignore this email. No attendance or subscription is confirmed. We will not send a reminder.`},{idempotencyKey:`receipt/${id}`});
  if(!sent.error)status='sent';
 }catch{/* no personal data or token in logs */}
 try{await sb.from('activity_responses').update({receipt_status:status}).eq('id',id);}catch{/* the saved answer remains successful */}
 return status;
}
