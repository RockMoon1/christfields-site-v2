import dns from 'node:dns/promises';
import net from 'node:net';
import ical from 'node-ical';
import { SLOTS, type Slot } from '@/lib/dashboard/availability';

/**
 * Server-only: fetch a member's private calendar feed (.ics) and turn it into
 * busy {date, slot} blocks for a date window. We store ONLY busy slots, never
 * event titles or details.
 *
 * Safety:
 *  - Only https links to known calendar providers are allowed (SSRF guard).
 *  - The fetch has an 8s timeout and the body is capped at ~2MB.
 *  - Every event is parsed inside a try/catch, so one malformed entry cannot
 *    break the whole sync.
 *
 * Time: events are absolute instants. We map them to morning/afternoon/evening
 * using the member's IANA timezone, captured in their browser when they connect.
 */

const ALLOWED_HOST_SUFFIXES = ['.google.com', '.icloud.com', '.office365.com', '.outlook.com', '.live.com'];
const ALLOWED_HOSTS = ['calendar.google.com', 'outlook.office365.com', 'outlook.live.com'];

export interface ValidatedUrl {
  ok: true;
  url: string;
}
export interface InvalidUrl {
  ok: false;
  error: string;
}

/** Normalize + safety-check a pasted calendar link. Returns an https URL. */
export function validateIcsUrl(raw: string): ValidatedUrl | InvalidUrl {
  let value = raw.trim();
  if (!value) return { ok: false, error: 'Paste your calendar link first.' };

  // Apple uses webcal://; treat it as https.
  if (value.toLowerCase().startsWith('webcal://')) value = `https://${value.slice('webcal://'.length)}`;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: 'That does not look like a valid link.' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'The link must start with https (or webcal).' };
  }

  const host = parsed.hostname.toLowerCase();
  const allowed =
    ALLOWED_HOSTS.includes(host) || ALLOWED_HOST_SUFFIXES.some((s) => host.endsWith(s));
  if (!allowed) {
    return {
      ok: false,
      error: 'We support private calendar links from Google, Apple iCloud, and Outlook.',
    };
  }

  return { ok: true, url: parsed.toString() };
}

/** Reject IPs in private, loopback, link-local, or other reserved ranges (SSRF guard). */
function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const ip6 = ip.toLowerCase();
  if (ip6 === '::1' || ip6 === '::') return true;
  if (ip6.startsWith('fe80')) return true; // link-local
  if (ip6.startsWith('fc') || ip6.startsWith('fd')) return true; // unique-local fc00::/7
  if (ip6.startsWith('::ffff:')) return isPrivateAddress(ip6.slice('::ffff:'.length)); // IPv4-mapped
  return false;
}

/** True only if every DNS answer for the host resolves to a public address. */
async function hostIsPublic(hostname: string): Promise<boolean> {
  try {
    const records = await dns.lookup(hostname, { all: true });
    return records.length > 0 && records.every((r) => !isPrivateAddress(r.address));
  } catch {
    return false;
  }
}

/**
 * Fetch the feed, following redirects OURSELVES so the allowlist + IP guard are
 * re-checked on every hop. This closes the SSRF where an allowlisted host could
 * 302 to an internal / cloud-metadata target. We also resolve the host and
 * refuse any private/reserved IP, which defends DNS-rebinding and inward-pointing
 * names. Caps redirect hops, total time (8s), and body size (2MB).
 */
async function fetchIcsText(initialUrl: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let url = initialUrl;
    for (let hop = 0; hop < 4; hop += 1) {
      const checked = validateIcsUrl(url);
      if (!checked.ok) throw new Error('Calendar link points to a disallowed location.');
      const target = new URL(checked.url);
      if (!(await hostIsPublic(target.hostname))) {
        throw new Error('Calendar host resolved to a non-public address.');
      }
      const res = await fetch(checked.url, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'ChristFields-Availability/1.0', Accept: 'text/calendar, text/plain' },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) throw new Error(`Calendar feed returned ${res.status} with no location`);
        url = new URL(loc, checked.url).toString(); // re-validated at the top of the next hop
        continue;
      }
      if (!res.ok) throw new Error(`Calendar feed returned ${res.status}`);
      const text = await res.text();
      return text.length > 2_000_000 ? text.slice(0, 2_000_000) : text;
    }
    throw new Error('Calendar link redirected too many times.');
  } finally {
    clearTimeout(timer);
  }
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function utcIso(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Local date (YYYY-MM-DD) and hour for an instant, in the given IANA timezone. */
function localParts(ms: number, tz: string): { iso: string; hour: number } {
  try {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    });
    const parts = dtf.formatToParts(new Date(ms));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    let hour = parseInt(get('hour'), 10);
    if (Number.isNaN(hour) || hour === 24) hour = 0;
    return { iso: `${get('year')}-${get('month')}-${get('day')}`, hour };
  } catch {
    return { iso: utcIso(ms), hour: new Date(ms).getUTCHours() };
  }
}

function slotForHour(hour: number): Slot | null {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return null;
}

const HOUR = 3_600_000;
const DAY = 86_400_000;

function addBusy(
  out: Set<string>,
  startMs: number,
  endMs: number,
  allDay: boolean,
  tz: string,
  fromIso: string,
  toIso: string,
  fromMs: number,
  toMs: number,
): void {
  const s = Math.max(startMs, fromMs);
  const e = Math.min(Math.max(endMs, startMs + HOUR), toMs + DAY);
  const inWindow = (iso: string) => iso >= fromIso && iso <= toIso;

  if (allDay) {
    for (let t = s; t < e; t += DAY) {
      const iso = utcIso(t);
      if (inWindow(iso)) for (const slot of SLOTS) out.add(`${iso}|${slot}`);
    }
    return;
  }

  // Step hour by hour so multi-day and timezone math stay simple and correct.
  let steps = 0;
  const cap = 24 * 16;
  for (let t = s; t < e && steps < cap; t += HOUR, steps += 1) {
    const { iso, hour } = localParts(t, tz);
    if (!inWindow(iso)) continue;
    const slot = slotForHour(hour);
    if (slot) out.add(`${iso}|${slot}`);
  }
}

interface VEventLike {
  type?: string;
  start?: Date;
  end?: Date;
  datetype?: string;
  rrule?: { between: (after: Date, before: Date, inc?: boolean) => Date[] };
  exdate?: Record<string, Date>;
}

/** Parse an .ics string into busy {date, slot} entries within the window. */
export function extractBusySlots(
  icsText: string,
  tz: string,
  fromMs: number,
  toMs: number,
): { date: string; slot: Slot }[] {
  const out = new Set<string>();
  const fromIso = utcIso(fromMs);
  const toIso = utcIso(toMs);

  let parsed: Record<string, VEventLike>;
  try {
    parsed = ical.sync.parseICS(icsText) as unknown as Record<string, VEventLike>;
  } catch {
    return [];
  }

  for (const key of Object.keys(parsed)) {
    const ev = parsed[key];
    if (!ev || ev.type !== 'VEVENT' || !(ev.start instanceof Date)) continue;
    try {
      const startMs = ev.start.getTime();
      const endMs = ev.end instanceof Date ? ev.end.getTime() : startMs + HOUR;
      const durationMs = Math.max(HOUR, endMs - startMs);
      const allDay = ev.datetype === 'date';

      if (ev.rrule && typeof ev.rrule.between === 'function') {
        const occ = ev.rrule.between(new Date(fromMs - durationMs), new Date(toMs), true);
        const exdates = ev.exdate
          ? Object.values(ev.exdate).map((d) => (d instanceof Date ? d.toDateString() : ''))
          : [];
        for (const occStart of occ) {
          if (!(occStart instanceof Date)) continue;
          if (exdates.includes(occStart.toDateString())) continue;
          const oStart = occStart.getTime();
          addBusy(out, oStart, oStart + durationMs, allDay, tz, fromIso, toIso, fromMs, toMs);
        }
      } else {
        if (endMs < fromMs || startMs > toMs) continue;
        addBusy(out, startMs, endMs, allDay, tz, fromIso, toIso, fromMs, toMs);
      }
    } catch {
      // Skip a malformed event rather than failing the whole feed.
    }
  }

  return [...out].map((k) => {
    const [date, slot] = k.split('|');
    return { date, slot: slot as Slot };
  });
}

export interface SyncResult {
  ok: boolean;
  slots: { date: string; slot: Slot }[];
  error?: string;
}

/** Fetch + parse a feed into busy slots for the window. Never throws. */
export async function fetchBusySlots(
  url: string,
  tz: string,
  fromMs: number,
  toMs: number,
): Promise<SyncResult> {
  try {
    const text = await fetchIcsText(url);
    if (!text.includes('BEGIN:VCALENDAR')) {
      return { ok: false, slots: [], error: 'That link did not return a calendar.' };
    }
    return { ok: true, slots: extractBusySlots(text, tz, fromMs, toMs) };
  } catch (err) {
    const msg =
      err instanceof Error && err.name === 'AbortError'
        ? 'The calendar took too long to respond. Try again.'
        : 'Could not read that calendar link.';
    console.error('fetchBusySlots failed', err);
    return { ok: false, slots: [], error: msg };
  }
}
