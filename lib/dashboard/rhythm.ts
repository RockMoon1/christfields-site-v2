/**
 * The two-week rhythm: has this person been in the room lately?
 *
 * "Seen" means either a leader marked them present, or they said yes to a
 * gathering that has since happened. Pure functions; callers fetch the rows.
 * Nothing here is ever shown to other members; leaders see first names only.
 */

export const RHYTHM_DAYS = 14;
const DAY = 86_400_000;

export interface SeenInputs {
  /** event_attendance rows with present = true. */
  attendance: { clerk_user_id: string; event_id: string }[];
  /** event_rsvps rows with status = 'going'. */
  going: { clerk_user_id: string; event_id: string }[];
  /** starts_at per event id, for the events referenced above. */
  eventStarts: Map<string, string>;
  nowMs: number;
}

/** Most recent time each member was seen, as ms since epoch. Absent = never. */
export function lastSeenByMember(inputs: SeenInputs): Map<string, number> {
  const out = new Map<string, number>();
  const bump = (uid: string, eventId: string) => {
    const iso = inputs.eventStarts.get(eventId);
    if (!iso) return;
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms) || ms > inputs.nowMs) return; // the future does not count
    if ((out.get(uid) ?? 0) < ms) out.set(uid, ms);
  };
  for (const a of inputs.attendance) bump(a.clerk_user_id, a.event_id);
  for (const g of inputs.going) bump(g.clerk_user_id, g.event_id);
  return out;
}

/**
 * Members who have not been seen for RHYTHM_DAYS. Someone who joined less
 * than RHYTHM_DAYS ago is never listed; give them a fortnight first.
 */
export function notSeenLately(
  members: { userId: string; joinedAtMs: number }[],
  lastSeen: Map<string, number>,
  nowMs: number,
  days: number = RHYTHM_DAYS,
): string[] {
  const cutoff = nowMs - days * DAY;
  return members
    .filter((m) => {
      if (m.joinedAtMs && m.joinedAtMs > cutoff) return false;
      const seen = lastSeen.get(m.userId);
      return seen === undefined || seen < cutoff;
    })
    .map((m) => m.userId);
}

/** Whether a reminder is due: not nudged in the last RHYTHM_DAYS. */
export function nudgeDue(rhythmNudgedAt: string | null, nowMs: number, days: number = RHYTHM_DAYS): boolean {
  if (!rhythmNudgedAt) return true;
  const ms = Date.parse(rhythmNudgedAt);
  return !Number.isFinite(ms) || nowMs - ms >= days * DAY;
}
