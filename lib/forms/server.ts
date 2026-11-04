import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { getSupabase } from '@/lib/supabase';
import { POLL_SLUG } from './availability';

// Verified identity, never a client-supplied email or user-editable metadata.
// The organizer already identified these addresses; no new accounts or roles.
export async function isFormsOrganizer(): Promise<boolean> {
  const user = await currentUser();
  return !!user?.emailAddresses.some(e => e.verification?.status === 'verified' &&
    ['lpellow05@gmail.com', 'proverbs@christfields2717.com'].includes(e.emailAddress.toLowerCase()));
}
export async function pollIsOpen(): Promise<boolean> {
  if (Date.now() >= Date.parse('2026-12-01T07:00:00Z')) return false;
  try {
    const { data, error } = await getSupabase().from('activity_forms').select('enabled').eq('slug', POLL_SLUG).single();
    return !error && data?.enabled === true;
  } catch { return false; }
}
