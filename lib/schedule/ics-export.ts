import type { MemberEvent } from './public-event';

/**
 * iCalendar output for one event (download) or a member's whole schedule (a
 * subscribe feed). Only member-visible fields go in, via MemberEvent.
 *
 * UID is stable per event so re-adding updates in place instead of duplicating
 * (the TimeTree duplicate-import bug we design against); SEQUENCE increments
 * with events.version; a cancelled event carries STATUS:CANCELLED.
 */

const DOMAIN = 'christfields2717.com';

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 20260904T190000Z */
export function icsUtc(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** RFC 5545 text escaping. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold long lines at 75 octets (approximated by characters). */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  return parts.join('\r\n');
}

/** Default an open-ended event to 90 minutes so calendars have a block to show. */
function endFor(e: MemberEvent): string {
  if (e.endsAt) return e.endsAt;
  return new Date(new Date(e.startsAt).getTime() + 90 * 60_000).toISOString();
}

export function eventUrl(baseUrl: string, id: string): string {
  return `${baseUrl.replace(/\/$/, '')}/dashboard/e/${id}`;
}

function vevent(e: MemberEvent, baseUrl: string, nowIso: string): string[] {
  const description = [e.description, e.memberNote ? `\n${e.memberNote}` : '', `\n${eventUrl(baseUrl, e.id)}`]
    .filter(Boolean)
    .join('\n')
    .trim();
  const lines = [
    'BEGIN:VEVENT',
    `UID:${e.id}@${DOMAIN}`,
    `DTSTAMP:${icsUtc(nowIso)}`,
    `DTSTART:${icsUtc(e.startsAt)}`,
    `DTEND:${icsUtc(endFor(e))}`,
    `SUMMARY:${esc(e.status === 'cancelled' ? `Called off: ${e.title}` : e.title)}`,
    `SEQUENCE:${e.version}`,
    `STATUS:${e.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
  ];
  if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
  if (description) lines.push(`DESCRIPTION:${esc(description)}`);
  lines.push(`URL:${eventUrl(baseUrl, e.id)}`);
  lines.push('END:VEVENT');
  return lines;
}

function wrap(name: string, body: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Christ Fields//Schedule//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    ...body,
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n') + '\r\n';
}

/** A single event as a downloadable .ics. */
export function buildEventIcs(e: MemberEvent, baseUrl: string, nowIso: string = new Date().toISOString()): string {
  return wrap('Christ Fields', vevent(e, baseUrl, nowIso));
}

/** A member's whole schedule as a subscribe feed. */
export function buildFeedIcs(events: MemberEvent[], baseUrl: string, nowIso: string = new Date().toISOString()): string {
  const body = events.flatMap((e) => vevent(e, baseUrl, nowIso));
  return wrap('Christ Fields', body);
}

/**
 * The Google Calendar "add" link. No API, no OAuth, works from any browser and
 * from an email. Times are sent as UTC (trailing Z) with the event's zone as ctz
 * so Google renders the right local time.
 */
export function googleTemplateUrl(e: MemberEvent, baseUrl: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${icsUtc(e.startsAt)}/${icsUtc(endFor(e))}`,
    ctz: e.tz,
    details: [e.description, eventUrl(baseUrl, e.id)].filter(Boolean).join('\n'),
  });
  if (e.location) params.set('location', e.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
