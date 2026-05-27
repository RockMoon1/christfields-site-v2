'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  getSupabase,
  type AvailabilityWeeklyRow,
  type AvailabilityOverrideRow,
  type CalendarFeedRow,
  type CalendarBusyRow,
  type CalendarFeedStatus,
} from '@/lib/supabase';
import { isSlot, type Slot } from '@/lib/dashboard/availability';
import { validateIcsUrl, fetchBusySlots } from '@/lib/dashboard/ics';

/**
 * Member-facing availability actions. Each member sets when they are usually
 * free (a weekly pattern), can override specific dates, and can connect a
 * private calendar link so busy times fill in automatically. Everything is
 * scoped to the signed-in user's Clerk id. Reads return safe defaults so the
 * page always renders.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const SYNC_DAYS = 28; // window we read from the calendar feed

export interface CalendarInfo {
  connected: boolean;
  status: CalendarFeedStatus | null;
  host: string | null; // e.g. "calendar.google.com" — never the secret URL
  lastSyncedAt: string | null;
  error: string | null;
  busy: { date: string; slot: Slot }[];
}

export interface MyAvailability {
  weekly: string[]; // "weekday-slot" keys that are free
  overrides: { date: string; slot: Slot; available: boolean }[];
  calendar: CalendarInfo;
}

async function requireUser(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

/** Confirm a timezone string is a real IANA zone, else fall back to UTC. */
function safeTz(tz: unknown): string {
  if (typeof tz !== 'string' || !tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

function startOfTodayUtcMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export async function getMyAvailability(): Promise<MyAvailability> {
  const empty: MyAvailability = {
    weekly: [],
    overrides: [],
    calendar: { connected: false, status: null, host: null, lastSyncedAt: null, error: null, busy: [] },
  };
  try {
    const userId = await requireUser();
    if (!userId) return empty;

    const sb = getSupabase();
    const [weeklyRes, overrideRes, feedRes, busyRes] = await Promise.all([
      sb.from('availability_weekly').select('weekday, slot').eq('clerk_user_id', userId),
      sb.from('availability_overrides').select('on_date, slot, available').eq('clerk_user_id', userId),
      sb.from('calendar_feeds').select('*').eq('clerk_user_id', userId).maybeSingle(),
      sb.from('calendar_busy').select('on_date, slot').eq('clerk_user_id', userId),
    ]);

    const weekly = ((weeklyRes.data as Pick<AvailabilityWeeklyRow, 'weekday' | 'slot'>[] | null) ?? []).map(
      (r) => `${r.weekday}-${r.slot}`,
    );
    const overrides = (
      (overrideRes.data as Pick<AvailabilityOverrideRow, 'on_date' | 'slot' | 'available'>[] | null) ?? []
    ).map((r) => ({ date: r.on_date, slot: r.slot as Slot, available: r.available }));

    const feed = feedRes.data as CalendarFeedRow | null;
    const busy = ((busyRes.data as Pick<CalendarBusyRow, 'on_date' | 'slot'>[] | null) ?? []).map((r) => ({
      date: r.on_date,
      slot: r.slot as Slot,
    }));

    let host: string | null = null;
    if (feed?.ics_url) {
      try {
        host = new URL(feed.ics_url).hostname;
      } catch {
        host = null;
      }
    }

    return {
      weekly,
      overrides,
      calendar: {
        connected: !!feed,
        status: feed?.status ?? null,
        host,
        lastSyncedAt: feed?.last_synced_at ?? null,
        error: feed?.last_error ?? null,
        busy,
      },
    };
  } catch (err) {
    console.error('getMyAvailability failed', err);
    return empty;
  }
}

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

/* ============================================================
   Calendar feed connect / refresh / disconnect.
   ============================================================ */

/** Fetch + parse the feed and replace this member's stored busy blocks. */
async function syncFeed(userId: string, url: string, tz: string): Promise<{ ok: boolean; error?: string }> {
  const fromMs = startOfTodayUtcMs();
  const toMs = fromMs + SYNC_DAYS * DAY;
  const result = await fetchBusySlots(url, tz, fromMs, toMs);

  const sb = getSupabase();
  await sb.from('calendar_busy').delete().eq('clerk_user_id', userId);
  if (result.ok && result.slots.length > 0) {
    const { error } = await sb
      .from('calendar_busy')
      .insert(result.slots.map((s) => ({ clerk_user_id: userId, on_date: s.date, slot: s.slot })));
    if (error) console.error('syncFeed: busy insert failed', error);
  }

  await sb
    .from('calendar_feeds')
    .update({
      status: result.ok ? 'ok' : 'error',
      last_error: result.error ?? null,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tz,
    })
    .eq('clerk_user_id', userId);

  revalidatePath('/dashboard/availability');
  return { ok: result.ok, error: result.error };
}

export async function connectCalendar(rawUrl: string, tz: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireUser();
    if (!userId) return { ok: false, error: 'Not signed in.' };

    const checked = validateIcsUrl(rawUrl);
    if (!checked.ok) return { ok: false, error: checked.error };

    const zone = safeTz(tz);
    const sb = getSupabase();
    const { error } = await sb.from('calendar_feeds').upsert(
      {
        clerk_user_id: userId,
        ics_url: checked.url,
        tz: zone,
        status: 'pending',
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' },
    );
    if (error) {
      console.error('connectCalendar: save failed', error);
      return { ok: false, error: 'Could not save the link. Please try again.' };
    }

    return await syncFeed(userId, checked.url, zone);
  } catch (err) {
    console.error('connectCalendar failed', err);
    return { ok: false, error: 'Something went wrong connecting your calendar.' };
  }
}

export async function refreshCalendar(tz: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireUser();
    if (!userId) return { ok: false, error: 'Not signed in.' };

    const sb = getSupabase();
    const { data } = await sb
      .from('calendar_feeds')
      .select('ics_url, tz')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    const feed = data as Pick<CalendarFeedRow, 'ics_url' | 'tz'> | null;
    if (!feed?.ics_url) return { ok: false, error: 'No calendar connected.' };

    return await syncFeed(userId, feed.ics_url, safeTz(tz) || feed.tz);
  } catch (err) {
    console.error('refreshCalendar failed', err);
    return { ok: false, error: 'Could not refresh your calendar.' };
  }
}

export async function disconnectCalendar(): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUser();
    if (!userId) return { ok: false };

    const sb = getSupabase();
    await sb.from('calendar_busy').delete().eq('clerk_user_id', userId);
    await sb.from('calendar_feeds').delete().eq('clerk_user_id', userId);

    revalidatePath('/dashboard/availability');
    return { ok: true };
  } catch (err) {
    console.error('disconnectCalendar failed', err);
    return { ok: false };
  }
}
