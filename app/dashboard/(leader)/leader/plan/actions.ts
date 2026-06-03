'use server';

import { getLeaderContext } from '@/lib/faithflow/leader-access';
import { getSupabase } from '@/lib/supabase';
import { SLOTS, upcomingDays, weeklyKey, overrideKey, isFree, type Slot } from '@/lib/dashboard/availability';

/**
 * Leader planning view. Aggregates the group's availability into a
 * free/busy heatmap so a leader can pick the best time to gather. Privacy: we
 * only ever expose who is free, never event details (there are none here, just
 * the free/busy each member set).
 *
 * Authorization runs through getLeaderContext (leader role in the active org).
 */

export interface PlanSlot {
  slot: Slot;
  freeCount: number;
  freeNames: string[];
}

export interface PlanDay {
  iso: string;
  dayShort: string;
  dateLabel: string;
  slots: PlanSlot[];
}

export interface PlanBest {
  iso: string;
  dayShort: string;
  dateLabel: string;
  slot: Slot;
  freeCount: number;
}

export type PlanResult =
  | { state: 'not-leader' }
  | { state: 'no-members'; org: { id: string; name: string } }
  | {
      state: 'ready';
      org: { id: string; name: string };
      total: number;
      days: PlanDay[];
      best: PlanBest[];
    };

const DAYS_AHEAD = 21;

export async function getGroupAvailability(): Promise<PlanResult> {
  const ctx = await getLeaderContext();
  if (!ctx) return { state: 'not-leader' };
  if (ctx.members.length === 0) {
    return { state: 'no-members', org: { id: ctx.orgId, name: ctx.orgName } };
  }

  const userIds = ctx.members.map((m) => m.userId);
  const nameByUser = new Map(ctx.members.map((m) => [m.userId, m.name]));
  const days = upcomingDays(DAYS_AHEAD);

  const sb = getSupabase();
  const [weeklyRes, overrideRes, busyRes] = await Promise.all([
    sb.from('availability_weekly').select('clerk_user_id, weekday, slot').in('clerk_user_id', userIds),
    sb
      .from('availability_overrides')
      .select('clerk_user_id, on_date, slot, available')
      .in('clerk_user_id', userIds)
      .gte('on_date', days[0].iso)
      .lte('on_date', days[days.length - 1].iso),
    sb
      .from('calendar_busy')
      .select('clerk_user_id, on_date, slot')
      .in('clerk_user_id', userIds)
      .gte('on_date', days[0].iso)
      .lte('on_date', days[days.length - 1].iso),
  ]);

  if (weeklyRes.error) console.error('getGroupAvailability: weekly load failed', weeklyRes.error);
  if (overrideRes.error) console.error('getGroupAvailability: override load failed', overrideRes.error);
  if (busyRes.error) console.error('getGroupAvailability: calendar busy load failed', busyRes.error);

  const weeklyByUser = new Map<string, Set<string>>();
  for (const r of (weeklyRes.data as { clerk_user_id: string; weekday: number; slot: string }[] | null) ?? []) {
    const set = weeklyByUser.get(r.clerk_user_id) ?? new Set<string>();
    set.add(weeklyKey(r.weekday, r.slot as Slot));
    weeklyByUser.set(r.clerk_user_id, set);
  }

  const overByUser = new Map<string, Map<string, boolean>>();
  for (const r of (overrideRes.data as
    | { clerk_user_id: string; on_date: string; slot: string; available: boolean }[]
    | null) ?? []) {
    const m = overByUser.get(r.clerk_user_id) ?? new Map<string, boolean>();
    m.set(overrideKey(r.on_date, r.slot as Slot), r.available);
    overByUser.set(r.clerk_user_id, m);
  }

  const busyByUser = new Map<string, Set<string>>();
  for (const r of (busyRes.data as { clerk_user_id: string; on_date: string; slot: string }[] | null) ?? []) {
    const set = busyByUser.get(r.clerk_user_id) ?? new Set<string>();
    set.add(overrideKey(r.on_date, r.slot as Slot));
    busyByUser.set(r.clerk_user_id, set);
  }

  const EMPTY_SET = new Set<string>();
  const EMPTY_MAP = new Map<string, boolean>();

  const planDays: PlanDay[] = days.map((d) => ({
    iso: d.iso,
    dayShort: d.dayShort,
    dateLabel: d.dateLabel,
    slots: SLOTS.map((slot) => {
      const freeNames: string[] = [];
      for (const uid of userIds) {
        const wf = weeklyByUser.get(uid) ?? EMPTY_SET;
        const ov = overByUser.get(uid) ?? EMPTY_MAP;
        const cb = busyByUser.get(uid) ?? EMPTY_SET;
        if (isFree(d.iso, d.weekday, slot, wf, ov, cb)) freeNames.push(nameByUser.get(uid) ?? 'Member');
      }
      return { slot, freeCount: freeNames.length, freeNames };
    }),
  }));

  const best: PlanBest[] = planDays
    .flatMap((d) => d.slots.map((s) => ({ iso: d.iso, dayShort: d.dayShort, dateLabel: d.dateLabel, slot: s.slot, freeCount: s.freeCount })))
    .filter((x) => x.freeCount > 0)
    .sort((a, b) => b.freeCount - a.freeCount)
    .slice(0, 5);

  return {
    state: 'ready',
    org: { id: ctx.orgId, name: ctx.orgName },
    total: userIds.length,
    days: planDays,
    best,
  };
}
