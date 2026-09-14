/** Browser-only synthetic action boundary. This module never imports a service. */
import type { GoogleStatus } from '@/components/dashboard/GoogleCards';
import type { Slot } from '@/lib/dashboard/availability';
type PendingAction = { name: string; resolve: () => void; reject: () => void };
const pending: PendingAction[] = [];
const calls: Record<string, number> = {};

function changed() { window.dispatchEvent(new Event('fixture-actions-changed')); }

export function actionSnapshot() {
  return { pending: pending.map(({ name }) => name), calls: { ...calls } };
}

export function settlePending(success: boolean) {
  const action = pending.shift();
  if (!action) return;
  if (success) action.resolve();
  else action.reject();
  changed();
}

export async function runFixtureAction(name: string) {
  calls[name] = (calls[name] ?? 0) + 1;
  const mode = new URLSearchParams(window.location.search).get('mode') ?? 'manual';
  if (mode === 'success') { changed(); return; }
  if (mode === 'failure') { changed(); throw new Error('Synthetic fixture rejection'); }
  return new Promise<void>((resolve, reject) => {
    pending.push({ name, resolve, reject: () => reject(new Error('Synthetic fixture rejection')) });
    changed();
  });
}

export async function postCommunityPrayer({ title, body }: { title: string; body: string }) {
  await runFixtureAction('post');
  return { id: 'fixture-posted', author_name: 'You', title, body, pray_count: 0,
    answered: false, created_at: '2026-09-07T18:00:00Z', prayedByMe: false, mine: true };
}
export async function prayForCommunity(_id: string) { await runFixtureAction('pray'); }
export async function markCommunityAnswered(_id: string) { await runFixtureAction('answered'); }
export async function deleteCommunityPrayer(_id: string) { await runFixtureAction('remove'); }

// Fixed public-facing records for the full prayer-wall page. These are synthetic,
// and this read does not touch the mutation counters or any production service.
interface CommunityPrayerView {
  id: string; author_name: string; title: string; body: string; pray_count: number;
  answered: boolean; created_at: string; prayedByMe: boolean; mine: boolean;
}
export async function getCommunity(): Promise<{
  prayers: CommunityPrayerView[]; totalPrayed: number; totalRequests: number;
}> {
  if (new URLSearchParams(window.location.search).get('variant') === 'empty') {
    return { prayers: [], totalPrayed: 0, totalRequests: 0 };
  }
  const prayers: CommunityPrayerView[] = [
    { id: 'fixture-other', author_name: 'Alex', title: 'Synthetic request from Alex',
      body: 'A fixture request for testing.', pray_count: 0, answered: false,
      created_at: '2026-09-07T18:00:00Z', prayedByMe: false, mine: false },
    { id: 'fixture-mine', author_name: 'You', title: 'Synthetic request of mine', body: '',
      pray_count: 0, answered: false, created_at: '2026-09-06T18:00:00Z', prayedByMe: false, mine: true },
    { id: 'fixture-prayed', author_name: 'Jordan', title: 'Walking with a friend through a difficult season',
      body: 'This synthetic request includes a longer paragraph to check wrapping and reading space. Please pray for patience, practical help, and enough rest as we support a friend through the week.',
      pray_count: 3, answered: false, created_at: '2026-08-31T18:00:00Z', prayedByMe: true, mine: false },
    { id: 'fixture-answered', author_name: 'Sam', title: 'Grateful for a safe journey',
      body: 'An answered synthetic request, included to review the quiet acknowledgement and its spacing.',
      pray_count: 2, answered: true, created_at: '2026-08-28T18:00:00Z', prayedByMe: false, mine: false },
  ];
  return { prayers, totalPrayed: 5, totalRequests: prayers.length };
}

export async function setRsvp(_id: string, next: 'going' | 'maybe' | 'not_going') {
  try { await runFixtureAction('rsvp'); }
  catch { return { ok: false as const }; }
  const faces: { displayName: string; imageUrl: string; status: 'going' | 'maybe' }[] = [
    { displayName: 'Alex', imageUrl: '', status: 'going' },
  ];
  if (next !== 'not_going') faces.push({ displayName: 'You', imageUrl: '', status: next });
  return { ok: true as const, faces };
}

// Structural copies of member-facing data contracts; no service module is loaded.
export interface MyAvailability {
  weekly: string[];
  overrides: { date: string; slot: Slot; available: boolean }[];
  calendar: {
    connected: boolean; status: 'pending' | 'ok' | 'error' | null;
    host: string | null; lastSyncedAt: string | null; error: string | null;
    busy: { date: string; slot: Slot }[];
  };
  google: { configured: boolean; connected: boolean; status: 'ok' | 'revoked' | 'error' | null };
}

function scenario() {
  const query = new URLSearchParams(window.location.search);
  const variant = query.get('variant') ?? 'disconnected';
  return {
    query,
    googleState: query.get('googleState') ?? variant,
    calendarState: query.get('calendarState') ?? variant,
  };
}

export async function getYou(): Promise<{
  emailReminders: boolean; feedUrl: string | null; hasAvailability: boolean;
  google: GoogleStatus; shareThemes: boolean;
}> {
  const { query, googleState } = scenario();
  const connected = ['connected', 'revoked', 'error'].includes(googleState);
  return {
    emailReminders: query.get('email') !== 'off',
    feedUrl: 'https://calendar.example.invalid/fixture-feed.ics',
    hasAvailability: true, shareThemes: true,
    google: {
      configured: googleState !== 'unconfigured', write: connected, busy: connected,
      status: googleState === 'revoked' ? 'revoked' : googleState === 'error' ? 'error' : connected ? 'ok' : null,
      lastError: null,
    },
  };
}

export async function getMyAvailability(): Promise<MyAvailability> {
  const { googleState, calendarState } = scenario();
  const connected = ['connected', 'revoked', 'error', 'stale'].includes(calendarState);
  const googleConnected = ['connected', 'revoked', 'error'].includes(googleState);
  const calendarError = ['revoked', 'error'].includes(calendarState);
  return {
    weekly: ['1-morning'], overrides: [],
    calendar: {
      connected, status: connected ? calendarError ? 'error' : 'ok' : null,
      host: connected ? 'calendar.example.invalid' : null,
      // Healthy fixtures do not inadvertently auto-refresh as the clock advances.
      lastSyncedAt: connected ? new Date(Date.now() - (calendarState === 'stale' ? 7 * 60 * 60 * 1000 : 0)).toISOString() : null,
      error: calendarError ? 'Synthetic calendar link could not be read.' : null,
      busy: [],
    },
    google: {
      configured: googleState !== 'unconfigured', connected: googleConnected,
      status: googleState === 'revoked' ? 'revoked' : googleState === 'error' ? 'error' : googleConnected ? 'ok' : null,
    },
  };
}

async function outcome(name: string): Promise<{ ok: boolean }> {
  try { await runFixtureAction(name); return { ok: true }; }
  catch { return { ok: false }; }
}

export async function setEmailReminders(_on: boolean): Promise<{ ok: boolean }> { return outcome('email'); }
export async function disconnectGoogle(): Promise<{ ok: boolean; calendarRemoved: boolean | null }> {
  const result = await outcome('google-disconnect');
  return { ...result, calendarRemoved: result.ok ? true : null };
}
export async function submitFeedback(_input: { category: string; message: string }): Promise<{ ok: boolean; error?: string }> {
  const result = await outcome('feedback');
  return result.ok ? result : { ok: false, error: 'Could not send right now. Please try again.' };
}
export async function setWeekly(_weekday: number, _slot: string, _on: boolean): Promise<{ ok: boolean }> { return outcome('weekly'); }
export async function connectCalendar(_rawUrl: string, _tz: string): Promise<{ ok: boolean; error?: string }> {
  const result = await outcome('calendar-connect');
  return result.ok ? result : { ok: false, error: 'Could not connect that calendar.' };
}
export async function refreshCalendar(_tz: string): Promise<{ ok: boolean; error?: string }> {
  const result = await outcome('calendar-refresh');
  return result.ok ? result : { ok: false, error: 'Could not check that calendar right now.' };
}
export async function disconnectCalendar(): Promise<{ ok: boolean }> { return outcome('calendar-disconnect'); }
