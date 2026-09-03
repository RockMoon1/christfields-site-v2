import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The durable record of every change a leader makes. Written BEFORE any push
 * or email, so a member whose notification never arrived still sees "Climbing
 * moved to Friday 7pm" in the Changed strip on Home. One row per org-level
 * change, never one per member.
 *
 * Fan-out (push + email) attaches to these rows in Phase 2 via lib/notify/fanout.
 */

export type ChangeKind = 'created' | 'changed' | 'cancelled' | 'thanks';

export interface RecordChangeInput {
  orgId: string;
  eventId: string;
  kind: ChangeKind;
  /** One line, e.g. "Moved to Thursday 7pm". */
  summary: string;
  createdBy: string;
}

export async function recordChange(sb: SupabaseClient, input: RecordChangeInput): Promise<string | null> {
  const { data, error } = await sb
    .from('event_changes')
    .insert({
      org_id: input.orgId,
      event_id: input.eventId,
      kind: input.kind,
      summary: input.summary.slice(0, 200),
      created_by: input.createdBy,
    })
    .select('id')
    .single();
  if (error) {
    console.error('recordChange failed', error);
    return null;
  }
  return (data as { id: string }).id;
}
