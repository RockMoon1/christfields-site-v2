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
import { encryptText, decryptText, isEncryptionConfigured } from '@/lib/security/crypto';

/**
 * Member-facing availability actions. Each member taps when they are usually
 * free (a weekly pattern) and can paste a private calendar link so busy times
 * fill in automatically. Everything is scoped to the signed-in Clerk id.
 *
 * Privacy: only (date, slot) busy rows are ever stored, tagged source='ics' so
 * they never collide with Google-derived rows; the private link is encrypted at
 * rest when CALENDAR_TOKEN_KEY is configured; only its hostname reaches the browser.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const SYNC_DAYS = 28;

export interface CalendarInfo {
  connected: boolean;
  status: CalendarFeedStatus | null;
  host: string | null;
  lastSyncedAt: string | null;
  error: string | null;
  busy: { date: string; slot: Slot }[];
}

export interface MyAvailability {
  weekly: string[];
  overrides: { date: string; slot: Slot; available: boolean }[];
  calendar: CalendarInfo;
}

async function requireUser(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

function isRealTz(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function safeTz(tz: unknown): string {
  return isRealTz(tz) ? tz : 'UTC';
}

function startOfTodayUtcMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

type FeedLink = Pick<CalendarFeedRow, 'clerk_user_id' | 'ics_url' | 'ics_url_enc'>;

/** The stored link from whichever column holds it; encrypts a legacy plaintext row on the way. */
async function readFeedUrl(feed: FeedLink): Promise<string | null> {
  if (feed.ics_url_enc) return decryptText(feed.ics_url_enc);
  if (feed.ics_url) {
    if (isEncryptionConfigured()) {
      const sb = getSupabase();
      await sb
        .from('calendar_feeds')
        .update({ ics_url_enc: encryptText(feed.ics_url), ics_url: '' })
        .eq('clerk_user_id', feed.clerk_user_id);
    }
    return feed.ics_url;
  }
  return null;
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
    if (feed) {
      const url = await readFeedUrl(feed);
      if (url) {
        try {
          host = new URL(url).hostname;
        } catch {
          host = null;
        }
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
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (err) {
    console.error('setWeekly failed', err);
    return { ok: false };
  }
}

/** Kept for completeness; the member UI no longer shows the override grid. */
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

/**
 * Fetch + parse a feed and replace this member's ICS-derived busy rows. Only
 * replaces once the fetch succeeded, so a timed-out provider never blanks a
 * member's busy blocks. Google-derived rows (source='google') are untouched.
 * Also used by the hourly tick, hence the explicit userId.
 */
export async function syncFeedForUser(
  userId: string,
  url: string,
  tz: string,
): Promise<{ ok: boolean; error?: string }> {
  const fromMs = startOfTodayUtcMs();
  const toMs = fromMs + SYNC_DAYS * DAY;
  const result = await fetchBusySlots(url, tz, fromMs, toMs);

  const sb = getSupabase();
  if (result.ok) {
    await sb.from('calendar_busy').delete().eq('clerk_user_id', userId).eq('source', 'ics');
    if (result.slots.length > 0) {
      const { error } = await sb
        .from('calendar_busy')
        .insert(result.slots.map((s) => ({ clerk_user_id: userId, on_date: s.date, slot: s.slot, source: 'ics' })));
      if (error) console.error('syncFeed: busy insert failed', error);
    }
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
    const encrypted = isEncryptionConfigured();
    const { error } = await sb.from('calendar_feeds').upsert(
      {
        clerk_user_id: userId,
        ics_url: encrypted ? '' : checked.url,
        ics_url_enc: encrypted ? encryptText(checked.url) : null,
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

    const res = await syncFeedForUser(userId, checked.url, zone);
    revalidatePath('/dashboard/availability');
    return res;
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
      .select('clerk_user_id, ics_url, ics_url_enc, tz')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    const feed = data as (FeedLink & { tz: string }) | null;
    if (!feed) return { ok: false, error: 'No calendar connected.' };
    const url = await readFeedUrl(feed);
    if (!url) return { ok: false, error: 'Could not read your calendar link. Connect it again.' };

    const res = await syncFeedForUser(userId, url, isRealTz(tz) ? tz : feed.tz);
    revalidatePath('/dashboard/availability');
    return res;
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
    await sb.from('calendar_busy').delete().eq('clerk_user_id', userId).eq('source', 'ics');
    await sb.from('calendar_feeds').delete().eq('clerk_user_id', userId);

    revalidatePath('/dashboard/availability');
    return { ok: true };
  } catch (err) {
    console.error('disconnectCalendar failed', err);
    return { ok: false };
  }
}
