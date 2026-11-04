export type ContactMode = 'off' | 'optional' | 'required';
export interface EventSettings {
  title: string; summary: string; tz: string; start: string; end: string;
  email: ContactMode; phone: ContactMode; receipts: boolean; moreInfo: boolean;
  clothing: string; scripture: string; information: string; weather: boolean;
  location: string; latitude: number | null; longitude: number | null;
  climateStation?: string; climateConfirmed?: boolean;
  publishToSite?: boolean;
  color: 'gold' | 'blue' | 'green' | 'rose'; status: 'planning' | 'scheduled' | 'completed' | 'cancelled';
}
export const DEFAULT_EVENT: EventSettings = {title:'November car camping',summary:'Winter is almost here, and ski season is starting! Help us find dates for car camping, walking through mountain towns, and time together. Tickets, discounts, costs and final arrangements will be confirmed separately.',tz:'America/Denver',start:'2026-11-01',end:'2026-11-30',email:'off',phone:'off',receipts:false,moreInfo:false,clothing:'',scripture:'',information:'',weather:false,location:'',latitude:null,longitude:null,color:'gold',status:'planning'};
export function localDate(tz: string, now = new Date()): string {
  const p = new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return `${p.find(x=>x.type==='year')!.value}-${p.find(x=>x.type==='month')!.value}-${p.find(x=>x.type==='day')!.value}`;
}
export function realDate(s: unknown): s is string { return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0,10)===s; }
export function datesFor(s: EventSettings, today = localDate(s.tz)): string[] {
  if(!realDate(s.start)||!realDate(s.end)) return [];
  const out:string[]=[]; for(let d=Date.parse(`${s.start}T12:00:00Z`);d<=Date.parse(`${s.end}T12:00:00Z`)&&out.length<62;d+=86400000){const date=new Date(d).toISOString().slice(0,10);if(date>=today)out.push(date);}return out;
}
export function parseSettings(value: unknown): EventSettings | null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const s=value as EventSettings;
  for(const [key,max] of [['title',100],['summary',1200],['clothing',1200],['scripture',1500],['information',2500],['location',160]] as const) if(typeof s[key]!=='string'||s[key].length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s[key]))return null;
  if(!s.title.trim()||!realDate(s.start)||!realDate(s.end)||s.start>s.end||Date.parse(s.end)-Date.parse(s.start)>61*86400000)return null;
  try{if(typeof s.tz!=='string'||s.tz.length>80)return null;localDate(s.tz);}catch{return null;}
  if(!['off','optional','required'].includes(s.email)||!['off','optional','required'].includes(s.phone))return null;
  for(const key of ['receipts','moreInfo','weather'] as const)if(typeof s[key]!=='boolean')return null;
  if(s.receipts&&s.email==='off')return null;
  if(!['gold','blue','green','rose'].includes(s.color)||!['planning','scheduled','completed','cancelled'].includes(s.status))return null;
  if(s.latitude!==null&&(typeof s.latitude!=='number'||!Number.isFinite(s.latitude)||Math.abs(s.latitude)>90))return null;
  if(s.longitude!==null&&(typeof s.longitude!=='number'||!Number.isFinite(s.longitude)||Math.abs(s.longitude)>180))return null;
  if(s.weather&&(!s.location.trim()||s.latitude===null||s.longitude===null))return null;
  if(s.climateStation!==undefined&&(typeof s.climateStation!=='string'||(s.climateStation!==''&&!/^[A-Z0-9]{11}$/.test(s.climateStation))))return null;
  if(s.climateConfirmed!==undefined&&typeof s.climateConfirmed!=='boolean')return null;
  if(s.publishToSite!==undefined&&typeof s.publishToSite!=='boolean')return null;
  if(s.climateStation&&(!s.climateConfirmed||!s.location.trim()||s.latitude===null||s.longitude===null))return null;
  return {...s,title:s.title.trim()};
}
export type ExtraAnswer = {email:string;phone:string;followUp:boolean;priorAttendance:'first'|'returning'|'unspecified';receiptRequested:boolean};
export function validateContact(v: Record<string,unknown>,s:EventSettings): ExtraAnswer|null {
  const email=v.email??'',phone=v.phone??'';
  if(typeof email!=='string'||typeof phone!=='string'||email.length>254||phone.length>32)return null;
  const e=email.trim().toLowerCase(),p=phone.trim();
  if((s.email==='required'&&!e)||(s.phone==='required'&&!p)||(s.email==='off'&&e)||(s.phone==='off'&&p))return null;
  if(e&&!/^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/.test(e))return null;
  if(p&&!/^\+?[0-9 ()-]{7,32}$/.test(p))return null;
  if(v.followUp!==undefined&&typeof v.followUp!=='boolean')return null;
  if(v.receiptRequested!==undefined&&typeof v.receiptRequested!=='boolean')return null;
  if(v.followUp&&!e&&!p)return null;
  if(v.receiptRequested&&(!s.receipts||!e))return null;
  const prior=v.priorAttendance??'unspecified';if(!['first','returning','unspecified'].includes(String(prior)))return null;
  return {email:e,phone:p,followUp:v.followUp===true,priorAttendance:prior as ExtraAnswer['priorAttendance'],receiptRequested:v.receiptRequested===true};
}
export const SLUG_RE=/^[a-z0-9][a-z0-9-]{2,79}$/;
export type ActivityForm = {slug:string;enabled:boolean;settings:EventSettings;photo_version:string|null};
