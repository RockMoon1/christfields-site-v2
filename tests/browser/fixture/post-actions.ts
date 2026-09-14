/** Synthetic posting boundary. No service, account, or notification is contacted. */
import type { EditInput, OrgAvailability, PostInput, ScriptureInput } from '@/app/dashboard/(app)/lead/actions';
import type { PostInitial } from '@/components/lead/PostForm';
import type { GroupAvailability } from '@/lib/schedule/group-availability';

// Preserve every existing leader fixture export and its separate action ledger.
export * from './leader-actions';

type ActionName = 'createEvent' | 'updateEvent' | 'getOrgAvailability';
type ActionCall = { id: number; name: ActionName; args: unknown[]; outcome: 'pending' | 'success' | 'failure' | 'throw'; persisted?: boolean };
type PendingAction = { id: number; name: ActionName; settle: (success: boolean) => void };
const pending: PendingAction[] = [];
const history: ActionCall[] = [];
const navigations: { method: string; destination?: string }[] = [];
let refreshes = 0;
const query = () => new URLSearchParams(window.location.search);
function changed() { window.dispatchEvent(new Event('post-fixture-actions-changed')); }

export function postActionSnapshot() {
  const calls = Object.fromEntries(['createEvent', 'updateEvent', 'getOrgAvailability'].map(name => [name, history.filter(item => item.name === name).length]));
  return { pending: pending.map(({ id, name }) => ({ id, name })), calls, history: structuredClone(history), navigations: structuredClone(navigations), refreshes };
}

export function settlePostAction(success: boolean, name?: ActionName, id?: number) {
  const index = pending.findIndex(item => (name === undefined || item.name === name) && (id === undefined || item.id === id));
  if (index >= 0) pending.splice(index, 1)[0].settle(success);
  changed();
}

export function recordPostNavigation(method: string, destination?: string) {
  if (method === 'refresh') refreshes += 1;
  else navigations.push({ method, destination });
  changed();
}

async function outcome(name: ActionName, args: unknown[]): Promise<ActionCall> {
  const entry: ActionCall = { id: history.length + 1, name, args: structuredClone(args), outcome: 'pending' };
  history.push(entry);
  const options = query();
  const mode = name === 'getOrgAvailability' ? options.get('availability') ?? 'success' : options.get('mode') ?? 'manual';
  const success = mode === 'manual'
    ? await new Promise<boolean>(settle => { pending.push({ id: entry.id, name, settle }); changed(); })
    : mode !== 'failure';
  const transport = name === 'getOrgAvailability' ? options.get('availability-transport') ?? options.get('transport') : options.get('transport');
  entry.outcome = success ? 'success' : transport === 'throw' ? 'throw' : 'failure';
  if (name !== 'getOrgAvailability') entry.persisted = success || options.get('partial') === '1';
  changed();
  if (entry.outcome === 'throw') throw new Error(`Synthetic ${name} transport failure`);
  return entry;
}

export async function createEvent(input: PostInput & ScriptureInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const result = await outcome('createEvent', [input]);
  return result.outcome === 'success'
    ? { ok: true, id: 'fixture-post-created' }
    : { ok: false, error: 'Synthetic event could not be saved.' };
}

export async function updateEvent(eventId: string, input: EditInput & ScriptureInput): Promise<{ ok: boolean; error?: string }> {
  const result = await outcome('updateEvent', [eventId, input]);
  return result.outcome === 'success' ? { ok: true } : { ok: false, error: 'Synthetic change could not be saved.' };
}

function availabilityFor(orgId: string): GroupAvailability {
  if (query().get('variant') === 'empty') return { total: 0, informed: 0, days: [], best: [] };
  const second = orgId === 'fixture-post-group-b';
  const total = second ? 12 : 8;
  const day = { iso: '2026-09-18', dayShort: 'Fri', dateLabel: 'Sep 18', weekday: 5 };
  const next = { iso: '2026-09-19', dayShort: 'Sat', dateLabel: 'Sep 19', weekday: 6 };
  return {
    total, informed: total - 1,
    days: [
      { ...day, slots: [{ slot: 'morning', free: 3, unknown: 1 }, { slot: 'afternoon', free: 4, unknown: 1 }, { slot: 'evening', free: second ? 3 : 2, unknown: 1 }] },
      { ...next, slots: [{ slot: 'morning', free: 4, unknown: 1 }, { slot: 'afternoon', free: second ? 10 : 6, unknown: 1 }, { slot: 'evening', free: 4, unknown: 1 }] },
    ],
    best: [{ ...next, slot: 'afternoon', free: second ? 10 : 6, freeNames: ['Alex', 'Jordan', 'Sam'] }],
  };
}

function orgAvailability(orgId: string, revision?: number): OrgAvailability {
  const long = query().get('variant') === 'long';
  const title = long ? 'An earlier synthetic gathering with a deliberately long name for narrow-screen wrapping' : 'Synthetic shared supper';
  return {
    availability: availabilityFor(orgId),
    upcoming: query().get('variant') === 'empty' ? [] : [{
      id: `${orgId}-upcoming`, title: revision === undefined ? title : `${title} · request ${revision}`,
      startsAt: '2026-09-18T23:00:00.000Z',
    }],
    lastRefreshedAt: '2026-09-14T15:00:00.000Z',
  };
}

export async function getOrgAvailability(orgId: string): Promise<OrgAvailability | null> {
  const result = await outcome('getOrgAvailability', [orgId]);
  // Distinct synthetic request labels make A–B–A stale-response races observable.
  return result.outcome === 'success' ? orgAvailability(orgId, result.id) : null;
}

export function readPostFixture() {
  const options = query();
  const form = options.get('form') ?? 'create';
  const variant = options.get('variant');
  const editing = form === 'edit' || form === 'series';
  const long = variant === 'long';
  const empty = variant === 'empty';
  const orgId = 'fixture-post-group-a';
  const initial: PostInitial = {
    orgId, title: empty ? '' : long ? 'A shared table and unhurried conversation for everyone in our synthetic community' : 'A table for the whole group',
    type: 'gathering', startsAtLocal: empty ? '' : '2026-09-18T19:00', endsAtIso: null,
    location: empty ? '' : long ? 'SyntheticCommunityRoomWithoutSpacesToExerciseNarrowScreenInputScrolling' : 'Synthetic community room',
    description: empty ? '' : 'Bring a little food, meet someone new, and leave room for conversation.',
    memberNote: editing || long ? 'What made you smile this week?\nWho helped you feel welcome?' : '',
    leaderNote: editing || long ? 'Synthetic leader note: leave room for newcomers.' : '',
    weeks: 1, bringItems: empty ? '' : 'Bread\nFruit, Cups', ridesEnabled: !empty,
    seriesId: form === 'series' ? 'fixture-post-series' : null,
    scriptureRef: editing || long ? 'Romans 12:1-2' : '',
    scriptureText: editing || long ? 'SYNTHETIC LEADER-SUPPLIED TEXT — this fixture is not a Bible quotation.' : '',
    scriptureWhy: editing || long ? 'Synthetic leader-supplied reason, preserved without attribution.' : '',
    discussion: editing || long ? 'What question would you bring to the gathering?' : '',
    contextNotes: editing || long ? 'SYNTHETIC PRIVATE LEADER CONTEXT — never a member payload.' : '',
  };
  const data = orgAvailability(orgId);
  return {
    mode: editing ? 'edit' as const : 'create' as const,
    eventId: editing ? 'fixture-post-existing' : undefined,
    orgs: [
      { orgId, orgName: long ? 'Synthetic Northside Community and Neighbourhood Gathering' : 'Synthetic Northside group' },
      ...(['multigroup', 'long'].includes(variant ?? '') ? [
        { orgId: 'fixture-post-group-b', orgName: long ? 'Synthetic Southside Community and Neighbourhood Gathering' : 'Synthetic Southside group' },
        { orgId: 'fixture-post-group-c', orgName: long ? 'Synthetic Riverside Community and Neighbourhood Gathering' : 'Synthetic Riverside group' },
      ] : []),
    ],
    initial, availability: options.get('initial-availability') === 'none' ? null : data.availability, upcoming: data.upcoming,
  };
}
