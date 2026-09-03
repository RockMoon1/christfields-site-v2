import type { EventType } from './events';

/**
 * The human touch: two lines for members, a few for leaders, keyed by the kind
 * of gathering. Plain English, no scripture in the defaults (the Foundation
 * page and the marketing site carry beliefs; this app carries logistics).
 *
 * HARD RULES, so this never drifts back into a curriculum:
 *  - At most two lines for members, three for leaders.
 *  - Members see their lines only after they have said they are in or not sure,
 *    on the event page and in the two-hour reminder. Never on Home, never a tab.
 *  - Nothing is counted, tracked, or marked done.
 *  - A leader can edit or blank the lines when posting. Blank renders nothing.
 */

export interface Prompts {
  /** Shown to members after they answer: "Two things you could ask someone." */
  members: [string, string];
  /** Shown to leaders before the event: "Questions that might come up." */
  leaders: string[];
}

export const PROMPTS: Record<EventType, Prompts> = {
  gathering: {
    members: [
      'Ask someone what their week actually looked like.',
      'Ask what they are looking forward to this month.',
    ],
    leaders: [
      'Someone may ask how long we go and whether they have to talk. Both answers are easy.',
      'Who is here for the first time? Say their name back to them.',
      'If someone is quiet, sit near them, not across from them.',
    ],
  },
  meal: {
    members: [
      'Ask someone what the best thing they ate this month was.',
      'Ask who taught them to cook, or who they wish had.',
    ],
    leaders: [
      'Someone may ask why we pray before we eat. A plain, short answer helps.',
      'Check the bring list: is anything missing that people will notice?',
      'Make sure nobody eats alone at the end of the table.',
    ],
  },
  outing: {
    members: [
      'Ask who talked them into this.',
      'Ask where they would go if they had a whole free Saturday.',
    ],
    leaders: [
      'Someone may ask if they need gear or experience. Say what is true and what we have spare.',
      'Check who has a ride and who still needs one.',
      'Plan the moment you all stop and just talk, not only the activity.',
    ],
  },
  serve: {
    members: [
      'Ask someone what got them here today.',
      'Ask what they would want if they were the one being helped.',
    ],
    leaders: [
      'Someone may ask why we do this. Keep it to one honest sentence.',
      'Pair a first-timer with someone who has done it before.',
      'Know the address, the contact, and what to bring, so nobody has to guess.',
    ],
  },
  celebration: {
    members: [
      'Ask the person being celebrated how they got here.',
      'Ask someone what they are grateful for this year.',
    ],
    leaders: [
      'Someone may ask what a baptism or a dedication means. Say it plainly.',
      'Give the quiet people a way to join in that is not a speech.',
      'Take one photo the group will want later.',
    ],
  },
};

/** Default prompts for a type, as newline-joined text for the Post form fields. */
export function defaultMemberNote(type: EventType): string {
  return PROMPTS[type].members.join('\n');
}

export function defaultLeaderNote(type: EventType): string {
  return PROMPTS[type].leaders.join('\n');
}

/** Split a stored note back into lines, capped so the UI never grows a list. */
export function noteLines(note: string, max: number): string[] {
  return note
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, max);
}
