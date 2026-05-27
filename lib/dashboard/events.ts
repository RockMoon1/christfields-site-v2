/**
 * Event types and their visual themes.
 *
 * The "motif" drives the animated banner on the member dashboard, so every kind
 * of gathering has its own lighting and movement. Leaders and masters pick the
 * type when they create an event; the banner reads the theme from here.
 *
 * Pure data + helpers only. Safe to import on the server or the client.
 */

export type EventType =
  | 'gathering'
  | 'worship'
  | 'service'
  | 'social'
  | 'prayer'
  | 'celebration';

/** The animated background style the banner renders for a type. */
export type EventMotif = 'embers' | 'aurora' | 'sunrise' | 'bokeh' | 'pulse' | 'confetti';

export interface EventTheme {
  key: EventType;
  label: string;
  /** A short line shown in the type picker. */
  tagline: string;
  motif: EventMotif;
  /** Primary accent (text, buttons, glow). */
  accent: string;
  /** Secondary accent, paired with the primary in gradients. */
  accent2: string;
  /** Ambient glow color (rgba). */
  glow: string;
}

export const EVENT_THEMES: Record<EventType, EventTheme> = {
  gathering: {
    key: 'gathering',
    label: 'Gathering',
    tagline: 'The main meetup',
    motif: 'embers',
    accent: '#c9a548',
    accent2: '#e4c97a',
    glow: 'rgba(201,165,72,0.45)',
  },
  worship: {
    key: 'worship',
    label: 'Worship night',
    tagline: 'Sung praise, late and full',
    motif: 'aurora',
    accent: '#8f7ad0',
    accent2: '#5b8db8',
    glow: 'rgba(126,107,168,0.45)',
  },
  service: {
    key: 'service',
    label: 'Service',
    tagline: 'Hands and feet, outreach',
    motif: 'sunrise',
    accent: '#e0903f',
    accent2: '#e4c97a',
    glow: 'rgba(196,123,60,0.45)',
  },
  social: {
    key: 'social',
    label: 'Social',
    tagline: 'Food, fun, fellowship',
    motif: 'bokeh',
    accent: '#e09a78',
    accent2: '#e4c97a',
    glow: 'rgba(217,140,106,0.4)',
  },
  prayer: {
    key: 'prayer',
    label: 'Prayer',
    tagline: 'Coming together to pray',
    motif: 'pulse',
    accent: '#52b788',
    accent2: '#5b8db8',
    glow: 'rgba(45,106,79,0.45)',
  },
  celebration: {
    key: 'celebration',
    label: 'Celebration',
    tagline: 'Baptisms, milestones, joy',
    motif: 'confetti',
    accent: '#e4c97a',
    accent2: '#c9a548',
    glow: 'rgba(228,201,122,0.5)',
  },
};

/** Stable display order for pickers and lists. */
export const EVENT_TYPE_LIST: EventTheme[] = [
  EVENT_THEMES.gathering,
  EVENT_THEMES.worship,
  EVENT_THEMES.service,
  EVENT_THEMES.social,
  EVENT_THEMES.prayer,
  EVENT_THEMES.celebration,
];

export function isEventType(value: string): value is EventType {
  return Object.prototype.hasOwnProperty.call(EVENT_THEMES, value);
}

/** Always returns a theme; unknown keys fall back to Gathering. */
export function eventTheme(key: string): EventTheme {
  return isEventType(key) ? EVENT_THEMES[key] : EVENT_THEMES.gathering;
}

/**
 * Friendly "when" label, e.g. "Fri, May 30 · 7:00 PM". Formatted in the
 * viewer's local time, so call it from client components (and pair the element
 * with suppressHydrationWarning, since the server renders in UTC).
 */
export function formatEventWhen(startsAtISO: string, endsAtISO?: string | null): string {
  const start = new Date(startsAtISO);
  if (Number.isNaN(start.getTime())) return '';

  const day = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (endsAtISO) {
    const end = new Date(endsAtISO);
    if (!Number.isNaN(end.getTime())) {
      const endTime = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${day} · ${time} – ${endTime}`;
    }
  }
  return `${day} · ${time}`;
}

/** How soon the event is, e.g. "Today", "Tomorrow", "In 3 days", "Past". */
export function eventCountdown(startsAtISO: string): string {
  const start = new Date(startsAtISO).getTime();
  if (Number.isNaN(start)) return '';
  const diffMs = start - Date.now();
  const dayMs = 86_400_000;
  if (diffMs < -dayMs) return 'Happened';
  if (diffMs < 0) return 'Happening now';
  const days = Math.round(diffMs / dayMs);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 14) return 'Next week';
  return `In ${Math.round(days / 7)} weeks`;
}
