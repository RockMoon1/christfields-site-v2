/**
 * Event types and their colours, plus small date helpers.
 *
 * Five plain words a new member understands. Leaders pick the type when they
 * post; the colour marks the card and the type chip. No animated motifs any
 * more: the dashboard is a schedule, not a light show.
 *
 * Pure data + helpers only. Safe to import on the server or the client.
 */

export type EventType = 'gathering' | 'meal' | 'outing' | 'serve' | 'celebration';

export interface EventTheme {
  key: EventType;
  label: string;
  /** A short line shown in the type picker. */
  tagline: string;
  /** Primary accent (text, borders, chips). */
  accent: string;
  /** Secondary accent, paired with the primary in gradients. */
  accent2: string;
}

export const EVENT_THEMES: Record<EventType, EventTheme> = {
  gathering: {
    key: 'gathering',
    label: 'Gathering',
    tagline: 'The regular group',
    accent: '#c9a548',
    accent2: '#e4c97a',
  },
  meal: {
    key: 'meal',
    label: 'Meal',
    tagline: 'Food together',
    accent: '#e09a78',
    accent2: '#e4c97a',
  },
  outing: {
    key: 'outing',
    label: 'Outing',
    tagline: 'Climbing, hiking, out and about',
    accent: '#5b8db8',
    accent2: '#8f7ad0',
  },
  serve: {
    key: 'serve',
    label: 'Serve',
    tagline: 'Hands and feet',
    accent: '#52b788',
    accent2: '#5b8db8',
  },
  celebration: {
    key: 'celebration',
    label: 'Celebration',
    tagline: 'Baptisms, birthdays, milestones',
    accent: '#e4c97a',
    accent2: '#c9a548',
  },
};

/** Stable display order for pickers and lists. */
export const EVENT_TYPE_LIST: EventTheme[] = [
  EVENT_THEMES.gathering,
  EVENT_THEMES.meal,
  EVENT_THEMES.outing,
  EVENT_THEMES.serve,
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
 * Friendly "when" label in the VIEWER's local time, e.g. "Fri, May 30 · 7:00 PM".
 * Call it from client components (pair with suppressHydrationWarning, since the
 * server renders in UTC). For server-rendered text use lib/dashboard/format.ts.
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

/** How soon the event is, e.g. "Today", "Tomorrow", "In 3 days", "Happened". */
export function eventCountdown(startsAtISO: string, nowMs: number = Date.now()): string {
  const start = new Date(startsAtISO).getTime();
  if (Number.isNaN(start)) return '';
  const diffMs = start - nowMs;
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
