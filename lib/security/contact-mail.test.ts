import {beforeEach,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({db:vi.fn()}));
vi.mock('@/lib/supabase',()=>({getSupabase:m.db}));
import {contactMailbox,reserveContactMail} from './contact-mail';
let count:number|null;
beforeEach(()=>{
 count=0;m.db.mockImplementation(()=>({from:(table:string)=>{
  expect(table).toBe('rate_limit_counters');let operation='read',next=0;const filters:Record<string,unknown>={};
  const query={select:()=>query,eq:(k:string,v:unknown)=>{filters[k]=v;return query;},insert:(row:{count:number,bucket:string})=>{expect(row.bucket).toBe('resend:day');operation='insert';next=row.count;return query;},update:(row:{count:number})=>{operation='update';next=row.count;return query;},maybeSingle:async()=>{
   await Promise.resolve();
   if(operation==='read'){expect(filters.bucket).toBe('resend:day');return {data:count===null?null:{count},error:null};}
   if(operation==='insert'){if(count!==null)return {data:null,error:{code:'23505'}};count=next;return {data:{count},error:null};}
   expect(filters.bucket).toBe('resend:day');
   if(filters.count!==count)return {data:null,error:null};count=next;return {data:{count},error:null};
  }};return query;
 }}));
});
it('accepts normalized bare mailboxes and rejects address syntax that can hide recipients',()=>{
 expect(contactMailbox(' Alice+camping@EXAMPLE.com ')).toBe('alice+camping@example.com');
 for(const value of ['first<alice@example.com>','second<alice@example.com>','Alice <alice@example.com>','alice@example.com,bob@example.com','alice(comment)@example.com','"alice"@example.com','alice@[127.0.0.1]','a..b@example.com','.alice@example.com','alice@-example.com','a'.repeat(65)+'@example.com','alice@example.com\r\nBcc:bob@example.com'])expect(contactMailbox(value),value).toBeNull();
});
it('reserves only the final info slot when callers race, preserving higher tiers',async()=>{
 count=49;const results=await Promise.all([reserveContactMail(),reserveContactMail(),reserveContactMail()]);expect(results.filter(Boolean)).toHaveLength(1);expect(count).toBe(50);
});
it('repeated denied reservations do not consume the reminder or urgent allowance',async()=>{
 for(const used of [50,65,79,80]){count=used;expect(await reserveContactMail()).toBe(false);expect(await reserveContactMail()).toBe(false);expect(count).toBe(used);}
});
it('handles a concurrent first insert without losing or duplicating reservations',async()=>{
 count=null;expect(await Promise.all([reserveContactMail(),reserveContactMail()])).toEqual([true,true]);expect(count).toBe(2);
});
it('fails closed on counter errors and malformed values',async()=>{
 m.db.mockImplementation(()=>{throw Error('Unavailable');});expect(await reserveContactMail()).toBe(false);
});
