'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type AvailabilityWeeklyRow, type AvailabilityOverrideRow } from '@/lib/supabase';
import { isSlot, type Slot } from '@/lib/dashboard/availability';

/**
 * Member-facing availability actions. Each member sets when they are usually
 * free (a weekly pattern) and can override specific dates. Everything is scoped
 * to the signed-in user's Clerk id. Reads return safe defaults so the page
 * always renders.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface MyAvailability {
  weekly: string[]; // "weekday-slot" keys that are free, e.g. "2-evening"
  overrides: { date: string; slot: Slot; available: boolean }[];
}

async function requireUser(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

export async function getMyAvailability(): Promise<MyAvailability> {
  try {
    const userId = await requireUser();
    if (!userId) return { weekly: [], overrides: [] };

    const sb = getSupabase();
    const [weeklyRes, overrideRes] = await Promise.all([
      sb.from('availability_weekly').select('weekday, slot').eq('clerk_user_id', userId),
      sb.from('availability_overrides').select('on_date, slot, available').eq('clerk_user_id', userId),
    ]);

    const weekly = ((weeklyRes.data as Pick<AvailabilityWeeklyRow, 'weekday' | 'slot'>[] | null) ?? []).map(
      (r) => `${r.weekday}-${r.slot}`,
    );
    const overrides = (
      (overrideRes.data as Pick<AvailabilityOverrideRow, 'on_date' | 'slot' | 'available'>[] | null) ?? []
    ).map((r) => ({ date: r.on_date, slot: r.slot as Slot, available: r.available }));

    return { weekly, overrides };
  } catch (err) {
    console.error('getMyAvailability failed', err);
    return { weekly: [], overrides: [] };
  }
}

/** Turn a usual-weekly slot on or off. */
export async function setWeekly(weekday: number, slot: string, on: boolean): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUser();
    if (!userId) return { ok: false };
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !isSlot(slot)) return { ok: false };

    const sb = getSupabase();
    if (on) {
      const { error } = await sb
        .from('availability_weekly')
        .upsert(
          { clerk_user_id: userId, weekday, slot },
          { onConflict: 'clerk_user_id,weekday,slot', ignoreDuplicates: true },
        );
      if (error) return { ok: false };
    } else {
      const { error } = await sb
        .from('availability_weekly')
        .delete()
        .eq('clerk_user_id', userId)
        .eq('weekday', weekday)
        .eq('slot', slot);
      if (error) return { ok: false };
    }

    revalidatePath('/dashboard/availability');
    return { ok: true };
  } catch (err) {
    console.error('setWeekly failed', err);
    return { ok: false };
  }
}

/**
 * Set or clear a specific-date override. Pass available=true (free) or
 * false (busy) to set it; pass null to clear it and fall back to the weekly
 * pattern.
 */
export async function setOverride(
  date: string,
  slot: string,
  available: boolean | null,
): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUser();
    if (!userId) return { ok: false };
    if (!DATE_RE.test(date) || !isSlot(slot)) return { ok: false };

    const sb = getSupabase();
    if (available === null) {
      const { error } = await sb
        .from('availability_overrides')
        .delete()
        .eq('clerk_user_id', userId)
        .eq('on_date', date)
        .eq('slot', slot);
      if (error) return { ok: false };
    } else {
      const { error } = await sb
        .from('availability_overrides')
        .upsert(
          { clerk_user_id: userId, on_date: date, slot, available },
          { onConflict: 'clerk_user_id,on_date,slot' },
        );
      if (error) return { ok: false };
    }

    revalidatePath('/dashboard/availability');
    return { ok: true };
  } catch (err) {
    console.error('setOverride failed', err);
    return { ok: false };
  }
}
