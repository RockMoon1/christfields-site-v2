'use server';
import {revalidatePath} from 'next/cache';
import {randomUUID} from 'node:crypto';
import {isFormsOrganizer} from '@/lib/forms/server';
import {getSupabase} from '@/lib/supabase';
import {parseSettings,SLUG_RE} from '@/lib/forms/events';
import {safeEventPhoto} from '@/lib/forms/photos';
import {climateNormals} from '@/lib/forms/climate';
const refresh=(slug:string)=>{revalidatePath('/dashboard/forms');revalidatePath('/forms');revalidatePath(`/forms/${slug}`);revalidatePath(`/dashboard/forms/${slug}/settings`);};
export async function saveEvent(form:FormData):Promise<void>{
 if(!(await isFormsOrganizer()))throw Error('Not authorized.');
 const slug=String(form.get('slug')||'');if(!SLUG_RE.test(slug)||slug==='receipt')throw Error('Use a unique link with 3–80 lowercase letters, numbers or hyphens. The name receipt is reserved.');
 const raw=form.get('settings');if(typeof raw!=='string'||raw.length>12000)throw Error('Invalid settings.');
 let settings;try{settings=parseSettings(JSON.parse(raw));}catch{throw Error('Invalid settings.');}if(!settings)throw Error('Check dates, contact requirements, timezone and location.');
 if(settings.climateStation&&!(await climateNormals(settings.climateStation)))throw Error('NOAA could not verify this station. Check the station ID or try again later.');
 const enabled=form.get('enabled');if(enabled!=='true'&&enabled!=='false')throw Error('Invalid enabled setting.');
 const sb=getSupabase(),value={slug,settings,enabled:enabled==='true',updated_at:new Date().toISOString()};
 const result=form.get('create')==='true'?await sb.from('activity_forms').insert(value):await sb.from('activity_forms').update(value).eq('slug',slug).select('slug').single();
 if(result.error)throw Error('Could not save. New event links must be unique.');refresh(slug);
}
export async function setPollEnabled(form:FormData):Promise<void>{
 if(!(await isFormsOrganizer()))throw Error('Not authorized.');
 const slug=String(form.get('slug')||'november-2026-car-camping'),value=form.get('enabled');if(!SLUG_RE.test(slug)||(value!=='true'&&value!=='false'))throw Error('Invalid settings.');
 const {error}=await getSupabase().from('activity_forms').update({enabled:value==='true'}).eq('slug',slug);if(error)throw Error('Could not save status.');refresh(slug);
}
export async function setAttendance(form:FormData):Promise<void>{
 if(!(await isFormsOrganizer()))throw Error('Not authorized.');
 const id=String(form.get('id')||''),slug=String(form.get('slug')||''),attendance=String(form.get('attendance')||'');
 if(!/^[a-f0-9-]{36}$/i.test(id)||!SLUG_RE.test(slug)||!['unknown','attended','no_show','cancelled'].includes(attendance))throw Error('Invalid update.');
 const {error}=await getSupabase().from('activity_responses').update({attendance}).eq('id',id).eq('form_slug',slug);if(error)throw Error('Could not save attendance.');refresh(slug);
}
export async function uploadEventPhoto(form:FormData):Promise<void>{
 if(!(await isFormsOrganizer()))throw Error('Not authorized.');
 const slug=String(form.get('slug')||''),file=form.get('photo');if(!SLUG_RE.test(slug)||!(file instanceof File)||file.size>500000)throw Error('Choose a JPEG, PNG or WebP under 500 KB.');
 const image_base64=await safeEventPhoto(new Uint8Array(await file.arrayBuffer()));const sb=getSupabase();
 const saved=await sb.from('activity_form_photos').upsert({form_slug:slug,image_base64});if(saved.error)throw Error('Could not save photo.');
 const updated=await sb.from('activity_forms').update({photo_version:randomUUID()}).eq('slug',slug);if(updated.error)throw Error('Could not publish photo.');refresh(slug);
}
export async function previewClimate(station:string){
 if(!(await isFormsOrganizer()))throw Error('Not authorized.');
 const data=await climateNormals(station);if(!data)throw Error('NOAA could not verify this station. Check the ID or try again later.');return data;
}
