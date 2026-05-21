'use server';

import { getSupabase } from '@/lib/supabase';
import { getLeaderContext, canViewMember } from '@/lib/faithflow/leader-access';
import { guidanceForMember, guidanceForGroup } from '@/lib/faithflow/guidance';
import {
  weekCompletions,
  currentStreak,
  totalDays,
  doneToday,
  lastNDays,
} from '@/lib/dashboard/streaks';
import type {
  AreaStatus,
  GroupAnalytics,
  GroupDataResult,
  MemberDetail,
  MemberSummary,
  OrgMember,
  Tier,
  Trend,
} from '@/lib/faithflow/types';

/* ============================================================
   Pure helpers (operate on already-fetched, bucketed data).
   Privacy: only scores, dates, mood values, and counts are
   ever read here. No journal, examen, gratitude, mood-note, or
   unshared prayer text is selected from the database.
   ============================================================ */

function tierFor(score: number | null): Tier {
  if (score === null) return 'none';
  if (score <= 3) return 'struggling';
  if (score <= 7) return 'growing';
  return 'leading';
}

function vitalityOf(areas: AreaStatus[]): number {
  const scored = areas.map((a) => a.latest).filter((s): s is number => s !== null);
  if (scored.length === 0) return 0;
  return scored.reduce((a, b) => a + b, 0) / scored.length;
}

function moodStats(series: { date: string; mood: number }[]): {
  avg: number | null;
  trend: Trend;
} {
  if (series.length === 0) return { avg: null, trend: 'none' };
  const avg = series.reduce((a, b) => a + b.mood, 0) / series.length;
  if (series.length < 3) return { avg, trend: 'none' };
  const mid = Math.floor(series.length / 2);
  const older = series.slice(0, mid);
  const newer = series.slice(mid);
  const om = older.reduce((a, b) => a + b.mood, 0) / older.length;
  const nm = newer.reduce((a, b) => a + b.mood, 0) / newer.length;
  const diff = nm - om;
  if (diff > 0.4) return { avg, trend: 'up' };
  if (diff < -0.4) return { avg, trend: 'down' };
  return { avg, trend: 'steady' };
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function maxDate(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => Boolean(d)).map((d) => d.slice(0, 10));
  if (valid.length === 0) return null;
  return valid.sort().at(-1) ?? null;
}

/* ============================================================
   Row shapes for the narrow selects we run.
   ============================================================ */

interface AreaRow {
  id: string;
  clerk_user_id: string;
  name: string;
  preset_key: string | null;
  color: string | null;
  target_score: number | null;
}
interface EntryRow {
  area_id: string;
  score: number;
  logged_at: string;
}
interface PracticeRow {
  id: string;
  clerk_user_id: string;
  name: string;
  color: string | null;
  cadence: string;
  target_per_week: number | null;
}
interface LogRow {
  practice_id: string;
  done_on: string;
}
interface MoodRow {
  clerk_user_id: string;
  mood: number;
  checked_at: string;
}

function groupBy<T, K>(rows: T[], key: (r: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = m.get(k) || [];
    list.push(r);
    m.set(k, list);
  }
  return m;
}

/* ============================================================
   Group view.
   ============================================================ */

export async function getGroupData(): Promise<GroupDataResult> {
  const ctx = await getLeaderContext();
  if (!ctx) return { state: 'not-leader' };

  const memberIds = ctx.members.map((m) => m.userId);
  if (memberIds.length === 0) {
    return { state: 'no-members', org: { id: ctx.orgId, name: ctx.orgName } };
  }

  try {
    const sb = getSupabase();
    const since = lastNDays(30)[0];

    const [areaRes, practiceRes, moodRes, prayerRes, memoryRes] = await Promise.all([
      sb.from('progress_areas').select('id, clerk_user_id, name, preset_key, color, target_score').in('clerk_user_id', memberIds),
      sb.from('practices').select('id, clerk_user_id, name, color, cadence, target_per_week').eq('archived', false).in('clerk_user_id', memberIds),
      sb.from('mood_checkins').select('clerk_user_id, mood, checked_at').in('clerk_user_id', memberIds).gte('checked_at', since),
      sb.from('prayer_requests').select('clerk_user_id, status').in('clerk_user_id', memberIds),
      sb.from('memory_verses').select('clerk_user_id, status').in('clerk_user_id', memberIds),
    ]);

    const areaRows = (areaRes.data as AreaRow[] | null) ?? [];
    const practiceRows = (practiceRes.data as PracticeRow[] | null) ?? [];
    const moodRows = (moodRes.data as MoodRow[] | null) ?? [];
    const prayerRows = (prayerRes.data as { clerk_user_id: string; status: string }[] | null) ?? [];
    const memoryRows = (memoryRes.data as { clerk_user_id: string; status: string }[] | null) ?? [];

    const areaIds = areaRows.map((a) => a.id);
    const entryRes = areaIds.length
      ? await sb.from('progress_entries').select('area_id, score, logged_at').in('area_id', areaIds).order('logged_at', { ascending: true })
      : { data: [] as EntryRow[] };
    const entryRows = (entryRes.data as EntryRow[] | null) ?? [];

    const practiceIds = practiceRows.map((p) => p.id);
    const logRes = practiceIds.length
      ? await sb.from('practice_logs').select('practice_id, done_on').in('practice_id', practiceIds)
      : { data: [] as LogRow[] };
    const logRows = (logRes.data as LogRow[] | null) ?? [];

    const areaByUser = groupBy(areaRows, (a) => a.clerk_user_id);
    const entriesByArea = groupBy(entryRows, (e) => e.area_id);
    const practiceByUser = groupBy(practiceRows, (p) => p.clerk_user_id);
    const logsByPractice = groupBy(logRows, (l) => l.practice_id);
    const moodByUser = groupBy(moodRows, (m) => m.clerk_user_id);

    function statusForUser(uid: string): AreaStatus[] {
      return (areaByUser.get(uid) || []).map((a) => {
        const es = (entriesByArea.get(a.id) || []).slice().sort((x, y) => x.logged_at.localeCompare(y.logged_at));
        const latest = es.length ? es[es.length - 1].score : null;
        const prev = es.length > 1 ? es[es.length - 2].score : null;
        return {
          name: a.name,
          presetKey: a.preset_key,
          color: a.color || '#c9a548',
          latest,
          prev,
          target: a.target_score,
          tier: tierFor(latest),
          count: es.length,
        };
      });
    }

    function summaryFor(member: OrgMember): MemberSummary {
      const uid = member.userId;
      const areas = statusForUser(uid);
      const vitality = vitalityOf(areas);

      const dailies = (practiceByUser.get(uid) || []).filter((p) => p.cadence === 'daily');
      let consistency = 0;
      if (dailies.length > 0) {
        let kept = 0;
        for (const p of dailies) kept += weekCompletions((logsByPractice.get(p.id) || []).map((l) => l.done_on));
        consistency = Math.round((kept / (dailies.length * 7)) * 100);
      }

      const moodSeries = (moodByUser.get(uid) || [])
        .map((m) => ({ date: m.checked_at.slice(0, 10), mood: m.mood }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const { avg: moodAvg, trend: moodTrend } = moodStats(moodSeries);

      const memberAreaIds = (areaByUser.get(uid) || []).map((a) => a.id);
      const lastEntry = maxDate(memberAreaIds.flatMap((id) => (entriesByArea.get(id) || []).map((e) => e.logged_at)));
      const lastLog = maxDate((practiceByUser.get(uid) || []).flatMap((p) => (logsByPractice.get(p.id) || []).map((l) => l.done_on)));
      const lastMood = maxDate((moodByUser.get(uid) || []).map((m) => m.checked_at));
      const lastActive = maxDate([lastEntry, lastLog, lastMood]);
      const since = daysSince(lastActive);

      const scored = areas.filter((a) => a.latest !== null);
      const weakest = scored.slice().sort((a, b) => (a.latest ?? 99) - (b.latest ?? 99))[0];
      const hasData = lastActive !== null;

      const attentionReasons: string[] = [];
      if (moodTrend === 'down') attentionReasons.push('Mood trending down');
      if (since !== null && since >= 7) attentionReasons.push(`Quiet for ${since} days`);
      if (hasData && vitality > 0 && vitality < 4) attentionReasons.push('Scores running low');
      if (!hasData) attentionReasons.push('No activity yet');

      return {
        userId: uid,
        name: member.name,
        email: member.email,
        imageUrl: member.imageUrl,
        isLeader: member.isLeader,
        vitality,
        rhythmConsistency: consistency,
        moodTrend,
        moodAvg,
        lastActive,
        daysSinceActive: since,
        topStruggle: weakest ? weakest.name : null,
        attention: attentionReasons.length > 0,
        attentionReasons,
        hasData,
      };
    }

    const members = ctx.members.map(summaryFor);

    // Group aggregates.
    const withData = members.filter((m) => m.hasData);
    const avgVitality = withData.length
      ? withData.reduce((a, b) => a + b.vitality, 0) / withData.length
      : 0;
    const activeThisWeek = members.filter((m) => m.daysSinceActive !== null && m.daysSinceActive <= 6).length;
    const moodAvgs = members.map((m) => m.moodAvg).filter((v): v is number => v !== null);
    const moodAvg = moodAvgs.length ? moodAvgs.reduce((a, b) => a + b, 0) / moodAvgs.length : null;
    const ups = members.filter((m) => m.moodTrend === 'up').length;
    const downs = members.filter((m) => m.moodTrend === 'down').length;
    const groupMoodTrend: Trend = ups === 0 && downs === 0 ? 'none' : downs > ups ? 'down' : ups > downs ? 'up' : 'steady';

    // Area averages across the group, keyed by preset or name.
    const areaAgg = new Map<string, { name: string; presetKey: string | null; color: string; sum: number; n: number }>();
    for (const m of members) {
      for (const a of statusForUser(m.userId)) {
        if (a.latest === null) continue;
        const key = a.presetKey || a.name.toLowerCase();
        const cur = areaAgg.get(key) || { name: a.name, presetKey: a.presetKey, color: a.color, sum: 0, n: 0 };
        cur.sum += a.latest;
        cur.n += 1;
        areaAgg.set(key, cur);
      }
    }
    const areaAverages = Array.from(areaAgg.values()).map((v) => ({
      name: v.name,
      presetKey: v.presetKey,
      color: v.color,
      avg: v.sum / v.n,
    }));
    const strugglingAreas = areaAverages
      .filter((a) => a.avg <= 4.5)
      .sort((a, b) => a.avg - b.avg)
      .map((a) => ({ name: a.name, presetKey: a.presetKey, avg: a.avg }));
    const strongAreas = areaAverages
      .filter((a) => a.avg >= 7.5)
      .sort((a, b) => b.avg - a.avg)
      .map((a) => ({ name: a.name, presetKey: a.presetKey, avg: a.avg }));

    void prayerRows;
    void memoryRows;

    const group: GroupAnalytics = {
      memberCount: members.length,
      activeThisWeek,
      avgVitality,
      moodAvg,
      moodTrend: groupMoodTrend,
      areaAverages,
      strugglingAreas,
      strongAreas,
      guidance: guidanceForGroup({
        strugglingAreas,
        moodTrend: groupMoodTrend,
        activeThisWeek,
        memberCount: members.length,
      }),
    };

    return { state: 'ready', org: { id: ctx.orgId, name: ctx.orgName }, members, group };
  } catch (err) {
    console.error('getGroupData failed', err);
    return { state: 'no-members', org: { id: ctx.orgId, name: ctx.orgName } };
  }
}

/* ============================================================
   Individual member view.
   ============================================================ */

export async function getMemberDetail(memberId: string): Promise<MemberDetail | null> {
  // Authorization: requester must be the admin of an org containing memberId.
  const allowed = await canViewMember(memberId);
  if (!allowed) return null;

  const ctx = await getLeaderContext();
  const member = ctx?.members.find((m) => m.userId === memberId);
  if (!ctx || !member) return null;

  try {
    const sb = getSupabase();
    const since = lastNDays(30)[0];

    const [areaRes, practiceRes, moodRes, prayerRes, sharedRes, memoryRes] = await Promise.all([
      sb.from('progress_areas').select('id, clerk_user_id, name, preset_key, color, target_score').eq('clerk_user_id', memberId),
      sb.from('practices').select('id, clerk_user_id, name, color, cadence, target_per_week').eq('archived', false).eq('clerk_user_id', memberId),
      sb.from('mood_checkins').select('clerk_user_id, mood, checked_at').eq('clerk_user_id', memberId).gte('checked_at', since).order('checked_at', { ascending: true }),
      sb.from('prayer_requests').select('status').eq('clerk_user_id', memberId),
      sb.from('prayer_requests').select('title, body, status').eq('clerk_user_id', memberId).eq('shared', true).order('created_at', { ascending: false }),
      sb.from('memory_verses').select('status').eq('clerk_user_id', memberId),
    ]);

    const areaRows = (areaRes.data as AreaRow[] | null) ?? [];
    const practiceRows = (practiceRes.data as PracticeRow[] | null) ?? [];
    const moodRows = (moodRes.data as MoodRow[] | null) ?? [];
    const prayerRows = (prayerRes.data as { status: string }[] | null) ?? [];
    const sharedRows = (sharedRes.data as { title: string; body: string; status: string }[] | null) ?? [];
    const memoryRows = (memoryRes.data as { status: string }[] | null) ?? [];

    const areaIds = areaRows.map((a) => a.id);
    const entryRes = areaIds.length
      ? await sb.from('progress_entries').select('area_id, score, logged_at').in('area_id', areaIds).order('logged_at', { ascending: true })
      : { data: [] as EntryRow[] };
    const entryRows = (entryRes.data as EntryRow[] | null) ?? [];

    const practiceIds = practiceRows.map((p) => p.id);
    const logRes = practiceIds.length
      ? await sb.from('practice_logs').select('practice_id, done_on').in('practice_id', practiceIds)
      : { data: [] as LogRow[] };
    const logRows = (logRes.data as LogRow[] | null) ?? [];

    const entriesByArea = groupBy(entryRows, (e) => e.area_id);
    const logsByPractice = groupBy(logRows, (l) => l.practice_id);

    const areas: AreaStatus[] = areaRows.map((a) => {
      const es = (entriesByArea.get(a.id) || []).slice().sort((x, y) => x.logged_at.localeCompare(y.logged_at));
      const latest = es.length ? es[es.length - 1].score : null;
      const prev = es.length > 1 ? es[es.length - 2].score : null;
      return {
        name: a.name,
        presetKey: a.preset_key,
        color: a.color || '#c9a548',
        latest,
        prev,
        target: a.target_score,
        tier: tierFor(latest),
        count: es.length,
      };
    });

    const rhythms = practiceRows.map((p) => {
      const dates = (logsByPractice.get(p.id) || []).map((l) => l.done_on);
      return {
        name: p.name,
        color: p.color || '#c9a548',
        cadence: p.cadence,
        weekDone: weekCompletions(dates),
        target: p.cadence === 'weekly' ? p.target_per_week ?? 1 : 7,
        streak: currentStreak(dates),
        total: totalDays(dates),
        doneToday: doneToday(dates),
      };
    });

    const moodSeries = moodRows
      .map((m) => ({ date: m.checked_at.slice(0, 10), mood: m.mood }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const { avg: moodAvg, trend: moodTrend } = moodStats(moodSeries);

    const lastEntry = maxDate(entryRows.map((e) => e.logged_at));
    const lastLog = maxDate(logRows.map((l) => l.done_on));
    const lastMood = maxDate(moodRows.map((m) => m.checked_at));
    const lastActive = maxDate([lastEntry, lastLog, lastMood]);
    const since2 = daysSince(lastActive);

    const vitality = vitalityOf(areas);
    const dailies = practiceRows.filter((p) => p.cadence === 'daily');
    let consistency = 0;
    if (dailies.length > 0) {
      let kept = 0;
      for (const p of dailies) kept += weekCompletions((logsByPractice.get(p.id) || []).map((l) => l.done_on));
      consistency = Math.round((kept / (dailies.length * 7)) * 100);
    }

    const scored = areas.filter((a) => a.latest !== null);
    const weakest = scored.slice().sort((a, b) => (a.latest ?? 99) - (b.latest ?? 99))[0];
    const hasData = lastActive !== null;

    const attentionReasons: string[] = [];
    if (moodTrend === 'down') attentionReasons.push('Mood trending down');
    if (since2 !== null && since2 >= 7) attentionReasons.push(`Quiet for ${since2} days`);
    if (hasData && vitality > 0 && vitality < 4) attentionReasons.push('Scores running low');
    if (!hasData) attentionReasons.push('No activity yet');

    const guidance = guidanceForMember({
      name: member.name,
      areas,
      moodTrend,
      daysSinceActive: since2,
      rhythmConsistency: consistency,
      hasData,
    });

    return {
      userId: memberId,
      name: member.name,
      email: member.email,
      imageUrl: member.imageUrl,
      isLeader: member.isLeader,
      vitality,
      rhythmConsistency: consistency,
      moodTrend,
      moodAvg,
      lastActive,
      daysSinceActive: since2,
      topStruggle: weakest ? weakest.name : null,
      attention: attentionReasons.length > 0,
      attentionReasons,
      hasData,
      areas,
      rhythms,
      mood: moodSeries,
      prayer: {
        open: prayerRows.filter((p) => p.status === 'open').length,
        answered: prayerRows.filter((p) => p.status === 'answered').length,
        shared: sharedRows.map((s) => ({ title: s.title, body: s.body, answered: s.status === 'answered' })),
      },
      memory: {
        learning: memoryRows.filter((m) => m.status === 'learning').length,
        memorized: memoryRows.filter((m) => m.status === 'memorized').length,
      },
      guidance,
    };
  } catch (err) {
    console.error('getMemberDetail failed', err);
    return null;
  }
}
