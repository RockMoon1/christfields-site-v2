import type { MemberEvent } from '@/lib/schedule/public-event';
import type { Slot } from '@/lib/dashboard/availability';
import { localParts, slotForHour } from '@/lib/dashboard/ics';

/**
 * The thin Google Calendar API layer. Everything runs server-side with a
 * short-lived access token; nothing here is ever imported by a browser.
 *
 * Privacy by construction:
 *  - Writes go only to a calendar this app created (the scope allows nothing
 *    else). Event bodies come from MemberEvent, so leader-only fields cannot
 *    reach Google.
 *  - Reads use freeBusy, which returns busy start/end pairs and never a title,
 *    and we keep only (date, morning/afternoon/evening) from those.
 *
 * Every call distinguishes "Google said no" (a definite 404/410) from "we do
 * not know" (timeout, 401, 403, 429, 5xx), because the caller must never take
 * a destructive step on "we do not know".
 */

const API = 'https://www.googleapis.com/calendar/v3';
const TIMEOUT_MS = 8_000;
const HOUR = 3_600_000;
const DEFAULT_LENGTH_MS = 90 * 60_000;

interface GResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

async function gfetch<T>(accessToken: string, path: string, init: RequestInit = {}, timeoutMs: number = TIMEOUT_MS): Promise<GResult<T>> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(Math.max(500, timeoutMs)),
    });
    if (res.status === 204) return { ok: true, status: 204, data: null };
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function gone(status: number): boolean {
  return status === 404 || status === 410;
}

/* ------------------------------------------------------------ the Christ Fields calendar */

export async function createCalendar(accessToken: string, tz: string): Promise<string | null> {
  const r = await gfetch<{ id?: string }>(accessToken, '/calendars', {
    method: 'POST',
    body: JSON.stringify({ summary: 'Christ Fields', description: 'Plans from your Christ Fields group. Managed by christfields2717.com.', timeZone: tz }),
  });
  return r.ok && r.data?.id ? r.data.id : null;
}

export type CalendarCheck = 'exists' | 'gone' | 'unknown';

/** 'gone' only on a definite 404/410; anything else uncertain is 'unknown'. */
export async function calendarExists(accessToken: string, calendarId: string): Promise<CalendarCheck> {
  const r = await gfetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}`);
  if (r.ok) return 'exists';
  return gone(r.status) ? 'gone' : 'unknown';
}

/** True when the calendar is no longer there (deleted now, or already gone). */
export async function deleteCalendar(accessToken: string, calendarId: string): Promise<boolean> {
  const r = await gfetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}`, { method: 'DELETE' });
  return r.ok || gone(r.status);
}

/* ------------------------------------------------------------ events */

export interface GoogleEventBody {
  summary: string;
  location?: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  source: { title: string; url: string };
  reminders: { useDefault: false; overrides: never[] };
  transparency: 'opaque';
  status: 'confirmed';
}

/** Built from the member-safe view only; no leader note, no host, no author. */
export function eventBody(e: MemberEvent, baseUrl: string): GoogleEventBody {
  const startMs = Date.parse(e.startsAt);
  const endMs = e.endsAt ? Date.parse(e.endsAt) : startMs + DEFAULT_LENGTH_MS;
  const url = `${baseUrl}/dashboard/e/${e.id}`;
  const lines = [e.description.trim(), `Who is in and how to answer: ${url}`].filter(Boolean);
  return {
    summary: e.title,
    ...(e.location ? { location: e.location } : {}),
    description: lines.join('\n\n'),
    start: { dateTime: new Date(startMs).toISOString(), timeZone: e.tz },
    end: { dateTime: new Date(Math.max(endMs, startMs + 15 * 60_000)).toISOString(), timeZone: e.tz },
    source: { title: 'Christ Fields', url },
    // Our own push and email are the reminders; Google popups would double them.
    reminders: { useDefault: false, overrides: [] },
    transparency: 'opaque',
    status: 'confirmed',
  };
}

export async function insertEvent(accessToken: string, calendarId: string, body: GoogleEventBody): Promise<string | null> {
  const r = await gfetch<{ id?: string }>(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return r.ok && r.data?.id ? r.data.id : null;
}

/** 'gone' when the member deleted it by hand; the caller may insert afresh. */
export async function patchEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  body: GoogleEventBody,
): Promise<'ok' | 'gone' | 'failed'> {
  const r = await gfetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (r.ok) return 'ok';
  return gone(r.status) ? 'gone' : 'failed';
}

export async function deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<boolean> {
  const r = await gfetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
  return r.ok || gone(r.status);
}

/* ------------------------------------------------------------ free / busy */

export interface BusyInterval {
  start: string;
  end: string;
}

/** Busy ranges on the primary calendar. Null on any failure (leave the old rows alone). */
export async function freeBusy(
  accessToken: string,
  tz: string,
  fromISO: string,
  toISO: string,
  timeoutMs: number = TIMEOUT_MS,
): Promise<BusyInterval[] | null> {
  const r = await gfetch<{ calendars?: Record<string, { busy?: BusyInterval[]; errors?: unknown[] }> }>(
    accessToken,
    '/freeBusy',
    {
      method: 'POST',
      body: JSON.stringify({ timeMin: fromISO, timeMax: toISO, timeZone: tz, items: [{ id: 'primary' }] }),
    },
    timeoutMs,
  );
  if (!r.ok || !r.data?.calendars) return null;
  const primary = r.data.calendars.primary ?? Object.values(r.data.calendars)[0];
  if (!primary || (primary.errors && primary.errors.length > 0)) return null;
  return primary.busy ?? [];
}

/**
 * Busy start/end pairs to (local date, slot) rows. Samples every hour mark
 * from the start and the last instant before the end, so a 16:30-17:15 dinner
 * marks both the afternoon and the evening. An interval that only touches the
 * middle of the night (a 2am alarm) yields nothing.
 */
export function intervalsToBusySlots(intervals: BusyInterval[], tz: string, fromMs: number, toMs: number): { date: string; slot: Slot }[] {
  const out = new Set<string>();
  const mark = (ms: number) => {
    const { iso, hour } = localParts(ms, tz);
    const slot = slotForHour(hour);
    if (slot) out.add(`${iso}|${slot}`);
  };
  for (const iv of intervals) {
    const s = Date.parse(iv.start);
    const e = Date.parse(iv.end);
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue;
    const start = Math.max(s, fromMs);
    const end = Math.min(e, toMs);
    if (end <= start) continue;
    let steps = 0;
    for (let t = start; t < end && steps < 24 * 60; t += HOUR, steps += 1) mark(t);
    mark(end - 1);
  }
  return [...out].map((k) => {
    const [date, slot] = k.split('|');
    return { date, slot: slot as Slot };
  });
}
