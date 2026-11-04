'use server';
import { revalidatePath } from 'next/cache';
import { isFormsOrganizer } from '@/lib/forms/server';
import { getSupabase } from '@/lib/supabase';
import { POLL_SLUG } from '@/lib/forms/availability';
export async function setPollEnabled(form: FormData) {
  if (!(await isFormsOrganizer())) throw new Error('Not authorized.');
  const value = form.get('enabled');
  if (value !== 'true' && value !== 'false') throw new Error('Invalid status.');
  const { error } = await getSupabase().from('activity_forms').update({ enabled: value === 'true' }).eq('slug', POLL_SLUG);
  if (error) throw new Error('The poll status could not be saved.');
  revalidatePath('/dashboard/forms'); revalidatePath('/forms'); revalidatePath(`/forms/${POLL_SLUG}`);
}
