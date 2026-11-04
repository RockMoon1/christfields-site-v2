import {parseSettings,localDate,SLUG_RE} from './events';
export type PublishedEvent={slug:string;title:string;summary:string;start:string;end:string;photo:string|null};
// Explicit public projection. Never return the settings object or response records.
export function publishedEvent(value:{slug:string;enabled:boolean;settings:unknown;photo_version?:string|null},now=new Date()):PublishedEvent|null{
 const s=parseSettings(value.settings);
 if(!s||!SLUG_RE.test(value.slug)||!value.enabled||s.publishToSite!==true||['completed','cancelled'].includes(s.status)||localDate(s.tz,now)>s.end)return null;
 return {slug:value.slug,title:s.title,summary:s.summary,start:s.start,end:s.end,photo:value.photo_version?`/api/forms/photo/${value.slug}?v=${encodeURIComponent(value.photo_version)}`:null};
}
