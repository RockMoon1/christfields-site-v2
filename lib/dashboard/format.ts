import { dayKeyInZone } from './timezone';

/**
 * Human dates and times for a specific IANA zone, safe on the server.
 *
 * Members read "Thursday, 7pm", never "2026-09-04T19:00Z". Every server-rendered
 * label goes through here with the member's zone (from the cf_tz cookie) or the
 * group's zone (events.tz) when the member's is unknown.
 */

function safeZone(tz: string | null | undefined): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

/** "7pm" or "7:30pm" in the zone. */
export function timeInWords(iso: string, tz: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone(tz),
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const period = (parts.find((p) => p.type === 'dayPeriod')?.value ?? '').toLowerCase();
  return minute === '00' ? `${hour}${period}` : `${hour}:${minute}${period}`;
}

/** Calendar-day distance between two instants in the zone (0 = same day). */
function dayDistance(iso: string, tz: string, nowMs: number): number {
  const zone = safeZone(tz);
  const a = dayKeyInZone(zone, new Date(nowMs));
  const b = dayKeyInZone(zone, new Date(iso));
  const ams = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
  const bms = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)));
  return Math.round((bms - ams) / 86_400_000);
}

/**
 * "Today, 7pm" / "Tomorrow, 7pm" / "Thursday, 7pm" (within a week) /
 * "Thu, Oct 3, 7pm" (further out) / "Thu, Oct 3, 2027, 7pm" (another year).
 */
export function whenInWords(iso: string, tz: string, nowMs: number = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const zone = safeZone(tz);
  const distance = dayDistance(iso, zone, nowMs);
  const time = timeInWords(iso, zone);

  if (distance === 0) return `Today, ${time}`;
  if (distance === 1) return `Tomorrow, ${time}`;
  if (distance > 1 && distance < 7) {
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'long' }).format(d);
    return `${weekday}, ${time}`;
  }
  const sameYear =
    new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric' }).format(d) ===
    new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric' }).format(new Date(nowMs));
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(d);
  return `${date}, ${time}`;
}

/** "Thu, Oct 3" in the zone. */
export function dateInWords(iso: string, tz: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone(tz),
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/** "in 2 days", "tomorrow", "today", "3 days ago" — for the Changed strip. */
export function relativeDays(iso: string, tz: string, nowMs: number = Date.now()): string {
  const n = dayDistance(iso, tz, nowMs);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  if (n > 1) return `in ${n} days`;
  return `${-n} days ago`;
}
