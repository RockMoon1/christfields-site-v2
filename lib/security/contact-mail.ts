import {getSupabase} from '@/lib/supabase';
import {EMAIL_BUCKET,TIER_LIMITS,emailWindowStartIso} from '@/lib/notify/rules';

/** One bare ASCII dot-atom mailbox, never a display name, list or comment.
 * The same normalized value is stored, throttled and passed to the provider.
 */
export function contactMailbox(value:unknown):string|null{
 if(typeof value!=='string')return null;
 const email=value.trim().toLowerCase();
 if(email.length>254)return null;
 const parts=email.split('@');if(parts.length!==2)return null;
 const [local,domain]=parts;
 if(!local||local.length>64||!local.split('.').every(p=>/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+$/.test(p)))return null;
 const labels=domain.split('.');
 if(labels.length<2||!labels.every(p=>p.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(p)))return null;
 return email;
}

/** Reserve from the existing shared info-tier daily budget. Conditional writes
 * are atomic compare-and-swap: denied attempts never inflate the counter into
 * capacity reserved for reminder/urgent tiers. No new RPC or permission needed.
 * A provider failure consumes its reserved attempt rather than risking retries.
 */
export async function reserveContactMail():Promise<boolean>{
 try{
  const sb=getSupabase(),window=emailWindowStartIso(Date.now());
  for(let attempt=0;attempt<3;attempt++){
   const result=await sb.from('rate_limit_counters').select('count').eq('bucket',EMAIL_BUCKET).eq('window_start',window).maybeSingle();
   if(result.error)return false;
   if(!result.data){
    const created=await sb.from('rate_limit_counters').insert({bucket:EMAIL_BUCKET,window_start:window,count:1}).select('count').maybeSingle();
    if(!created.error&&created.data?.count===1)return true;
    if(created.error?.code==='23505')continue;
    return false;
   }
   const count=result.data.count;
   if(!Number.isInteger(count)||count<0||count>=TIER_LIMITS.info)return false;
   const claimed=await sb.from('rate_limit_counters').update({count:count+1}).eq('bucket',EMAIL_BUCKET).eq('window_start',window).eq('count',count).select('count').maybeSingle();
   if(claimed.error)return false;
   if(claimed.data?.count===count+1)return true;
  }
 }catch{/* Fail closed without logging addresses or credentials. */}
 return false;
}
