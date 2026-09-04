import type { EventRow, EventRsvpStatus } from '@/lib/supabase';

/**
 * The member-facing shape of an event, built from an explicit allowlist.
 *
 * Every payload that reaches a member's browser, an .ics file, a feed, or a
 * tokenized page comes through toMemberEvent(). Never a row spread: leader_note,
 * host_user_id, created_by, thanks_note and anything added later stay server-side
 * unless they are named here on purpose.
 */

export interface MemberEvent {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string | null;
  tz: string;
  location: string;
  /** The leader's one line for people going (conversation starters live in memberNote). */
  description: string;
  memberNote: string;
  status: 'scheduled' | 'cancelled';
  cancelReason: string;
  cancelledAt: string | null;
  version: number;
  seriesId: string | null;
  ridesEnabled: boolean;
  /** Optional Scripture for the gathering. context_notes is leader-only and NOT here. */
  scriptureRef: string;
  scriptureText: string;
  scriptureWhy: string;
  discussion: string;
}

export function toMemberEvent(row: EventRow, orgName: string): MemberEvent {
  const cancelled = row.status === 'cancelled';
  return {
    id: row.id,
    orgId: row.org_id,
    orgName,
    title: row.title,
    type: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    tz: row.tz || 'America/Denver',
    location: row.location || '',
    description: row.description || '',
    memberNote: row.member_note || '',
    status: cancelled ? 'cancelled' : 'scheduled',
    cancelReason: cancelled ? row.cancel_reason || '' : '',
    cancelledAt: cancelled ? row.cancelled_at : null,
    version: row.version ?? 0,
    seriesId: row.series_id ?? null,
    ridesEnabled: !!row.rides_enabled,
    scriptureRef: row.scripture_ref || '',
    scriptureText: row.scripture_text || '',
    scriptureWhy: row.scripture_why || '',
    discussion: row.discussion || '',
  };
}

/** One face in the "who is in" list. Never carries a Clerk id or an email. */
export interface RsvpFace {
  displayName: string;
  imageUrl: string;
  status: Extract<EventRsvpStatus, 'going' | 'maybe'>;
}

/** Only going and maybe are ever shown to members; declines are leader-only. */
export function toFaces(
  rows: { status: EventRsvpStatus; display_name: string; image_url: string }[],
): RsvpFace[] {
  return rows
    .filter((r) => r.status === 'going' || r.status === 'maybe')
    .map((r) => ({
      displayName: r.display_name || '',
      imageUrl: r.image_url || '',
      status: r.status as 'going' | 'maybe',
    }));
}

/** A slot as a member sees it: what it is, how many spots, who has claimed. */
export interface MemberSlot {
  id: string;
  kind: 'bring' | 'ride';
  label: string;
  capacity: number;
  claims: { displayName: string; qty: number; mine: boolean }[];
  taken: number;
}
