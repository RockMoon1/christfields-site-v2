/** Browser-only leader boundary. Records are synthetic; no service is imported. */
import type { LeaderEventView, RosterName } from '@/app/dashboard/(app)/lead/actions';

// Preserve the existing member-event fixture's deliberately absent leader view.
export { getLeaderEvent } from './actions';

type PendingAction = { name: string; settle: (success: boolean) => void };
type ActionCall = { name: string; args: unknown[]; outcome: 'pending' | 'success' | 'failure' | 'throw' };
const pending: PendingAction[] = [];
const calls: Record<string, number> = {};
const history: ActionCall[] = [];
let refreshes = 0;
let persisted: LeaderEventView | undefined;

const query = () => new URLSearchParams(window.location.search);
function changed() { window.dispatchEvent(new Event('leader-fixture-actions-changed')); }

function person(userId: string, name: string, present: boolean | null = null, firstTime = false): RosterName {
  return { userId, name, imageUrl: '', firstTime, present };
}

function initialView(): LeaderEventView {
  const options = query();
  const variant = options.get('variant') ?? 'future';
  const cancelled = variant === 'cancelled';
  const started = cancelled || options.get('phase') === 'started'
    || (options.get('phase') !== 'future' && ['started', 'long'].includes(variant));
  const long = variant === 'long';
  const empty = variant === 'empty';
  const now = Date.now();
  const startsAt = new Date(now + (started ? -2 : 2) * 3_600_000).toISOString();
  const going = empty ? [] : [person('leader-alex', 'Alex', null), person('leader-jordan', long ? 'Jordan Alexandra Montgomery-Wellington' : 'Jordan', false, true)];
  const maybe = empty ? [] : [person('leader-sam', 'Sam', true)];
  const silent = empty ? [] : [person('leader-riley', long ? 'RileyAnneWithoutSpacesForNarrowScreenWrapping' : 'Riley'), person('leader-morgan', 'Morgan'), person('leader-taylor', 'Taylor'), person('leader-drew', 'Drew')];
  const cant = empty ? [] : [person('leader-casey', 'Casey', false)];
  return {
    event: {
      id: 'fixture-leader-event', orgId: 'fixture-leader-group', orgName: 'Synthetic group',
      title: 'A table for the whole group', type: 'gathering', startsAt, endsAt: null,
      tz: 'America/Denver', location: 'Synthetic community room', description: 'Synthetic gathering for browser review.',
      memberNote: '', status: cancelled ? 'cancelled' : 'scheduled',
      cancelReason: cancelled ? 'Synthetic weather cancellation.' : '',
      cancelledAt: cancelled ? new Date(now).toISOString() : null,
      version: 1, seriesId: null, ridesEnabled: true,
      scriptureRef: '', scriptureText: '', scriptureWhy: '', discussion: '',
    },
    leaderNote: empty ? '' : 'What would help someone new feel at home?\nWho can welcome people at the door?\nLeave a little room for unhurried conversation.',
    thanksNote: '',
    contextNotes: empty ? '' : long
      ? 'Synthetic leader-only context. This is fixture prose, not Scripture or a theological claim. Give each person time to speak, and let a quiet answer stay quiet.\nKeep these preparation notes within the leader view.'
      : 'Synthetic leader-only context. Welcome newcomers and leave time for questions.',
    going, maybe, cant, silent,
    slots: empty ? [] : [
      { id: 'leader-bread', kind: 'bring', label: long ? 'Bread, fruit, and a clearly labelled alternative for the shared table' : 'Bread for the table', capacity: 1, taken: 1, claimants: ['Alex'] },
      { id: 'leader-cups', kind: 'bring', label: 'Cups and napkins', capacity: 1, taken: 0, claimants: [] },
      { id: 'leader-ride', kind: 'ride', label: 'Ride from the library', capacity: 3, taken: 1, claimants: ['Jordan'] },
    ],
    attendanceOpen: started && !cancelled,
    markedCount: [...going, ...maybe, ...cant, ...silent].filter(person => person.present !== null).length,
    skippedEmails: empty ? 0 : 2,
    shareText: 'Synthetic gathering, this evening at the community room. 2 in so far. This text is local fixture data only.',
    canNudge: !started && !cancelled && silent.length > 0,
    nudged: variant === 'nudged',
  };
}

function view() { return persisted ??= initialView(); }
export function readLeaderView(): LeaderEventView { return structuredClone(view()); }
export function recordLeaderRefresh() { refreshes += 1; changed(); return readLeaderView(); }
export function leaderActionSnapshot() {
  return { pending: pending.map(({ name }) => name), calls: { ...calls }, history: structuredClone(history), refreshes };
}
export function settleLeaderAction(success: boolean) {
  pending.shift()?.settle(success);
  changed();
}

async function outcome(name: string, args: unknown[]): Promise<boolean> {
  calls[name] = (calls[name] ?? 0) + 1;
  const entry: ActionCall = { name, args, outcome: 'pending' };
  history.push(entry);
  const mode = query().get('mode') ?? 'manual';
  const success = mode === 'manual'
    ? await new Promise<boolean>((settle) => { pending.push({ name, settle }); changed(); })
    : mode !== 'failure';
  const throws = !success && query().get('transport') === 'throw';
  entry.outcome = success ? 'success' : throws ? 'throw' : 'failure';
  changed();
  if (throws) throw new Error(`Synthetic ${name} transport failure`);
  return success;
}

function markPerson(memberId: string, present: boolean) {
  const current = view();
  for (const list of [current.going, current.maybe, current.cant, current.silent]) {
    const member = list.find(person => person.userId === memberId);
    if (member) member.present = present;
  }
  current.markedCount = [...current.going, ...current.maybe, ...current.cant, ...current.silent]
    .filter(person => person.present !== null).length;
}

export async function markAttendance(eventId: string, memberId: string, present: boolean) {
  const ok = await outcome('markAttendance', [eventId, memberId, present]);
  if (ok) { markPerson(memberId, present); changed(); }
  return { ok };
}
export async function markEveryoneCame(eventId: string) {
  const ok = await outcome('markEveryoneCame', [eventId]);
  // The real action can report success after an unchecked write. This mode
  // verifies that the UI trusts reread props rather than inventing attendance.
  if (ok && query().get('bulk') !== 'no-change') { for (const person of view().going) markPerson(person.userId, true); changed(); }
  return { ok };
}
export async function postThanks(eventId: string, note: string) {
  const ok = await outcome('postThanks', [eventId, note]);
  // A late failure can follow a successful write in the real action.
  if (ok || query().get('partial') === '1') { view().thanksNote = note.trim().slice(0, 240); changed(); }
  return { ok };
}
export async function cancelEvent(eventId: string, reason: string) {
  const ok = await outcome('cancelEvent', [eventId, reason]);
  if (ok || query().get('partial') === '1') {
    const current = view();
    current.event = { ...current.event, status: 'cancelled', cancelReason: reason.trim().slice(0, 200), cancelledAt: new Date().toISOString(), version: current.event.version + 1 };
    current.attendanceOpen = false;
    current.canNudge = false;
    changed();
  }
  return { ok };
}
export async function nudgeEvent(eventId: string) {
  const ok = await outcome('nudgeEvent', [eventId]);
  const none = { ok, pushed: 0, emailed: 0, skippedBudget: 0, unreachable: 0 };
  if (!ok) return none;
  view().nudged = true;
  changed();
  const result = query().get('nudge');
  if (result === 'already') return { ...none, already: true };
  if (result === 'none') return { ...none, unreachable: 4 };
  return { ok: true, pushed: 1, emailed: 1, skippedBudget: 1, unreachable: 1 };
}
