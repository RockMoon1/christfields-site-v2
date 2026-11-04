import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { getSupabase } from '@/lib/supabase';
import { POLL_SLUG } from './availability';
import { parseSettings, localDate, type ActivityForm, SLUG_RE } from './events';

// Verified identity, never a client-supplied email or user-editable metadata.
// The organizer already identified these addresses; no new accounts or roles.
export async function isFormsOrganizer(): Promise<boolean> {
  const user = await currentUser();
  return !!user?.emailAddresses.some(e => e.verification?.status === 'verified' &&
    ['lpellow05@gmail.com', 'proverbs@christfields2717.com'].includes(e.emailAddress.toLowerCase()));
}
export async function pollIsOpen(): Promise<boolean> {
  const form=await getPublicForm(POLL_SLUG);return !!form&&formOpen(form);
}
export function formOpen(form:ActivityForm){return form.enabled&&!['completed','cancelled'].includes(form.settings.status)&&localDate(form.settings.tz)<=form.settings.end;}
export async function getPublicForm(slug:string):Promise<ActivityForm|null>{
  if(!SLUG_RE.test(slug))return null;
  try{const {data,error}=await getSupabase().from('activity_forms').select('slug,enabled,settings,photo_version').eq('slug',slug).single();const settings=parseSettings(data?.settings);return error||!settings?null:{slug:data.slug,enabled:data.enabled,settings,photo_version:data.photo_version};}catch{return null;}
}
