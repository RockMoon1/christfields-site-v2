import { getSupabase } from '@/lib/supabase';
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
  MemberDetail,
  MemberSummary,
  OrgMember,
  Tier,
  Trend,
} from '@/lib/faithflow/types';

/**
 * Shared analytics engine for FaithFlow. The leader dashboard computes member
 * and group status from this one shared place.
 *
 * Privacy: only scores, dates, mood values, and counts are read. No journal,
 * examen, gratitude, mood-note, or unshared prayer text is ever selected.
 */

/* ---- pure helpers ---- */

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

function moodStats(series: { date: string; mood: number }[]): { avg: number | null; trend: Trend } {
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

function attentionFor(opts: {
  moodTrend: Trend;
  daysSinceActive: number | null;
  vitality: number;
  hasData: boolean;
}): string[] {
  const reasons: string[] = [];
  if (opts.moodTrend === 'down') reasons.push('Mood trending down');
  if (opts.daysSinceActive !== null && opts.daysSinceActive >= 7) {
    reasons.push(`Quiet for ${opts.daysSinceActive} days`);
  }
  if (opts.hasData && opts.vitality > 0 && opts.vitality < 4) reasons.push('Scores running low');
  if (!opts.hasData) reasons.push('No activity yet');
  return reasons;
}

function blankSummary(member: OrgMember): MemberSummary {
  return {
    userId: member.userId,
    name: member.name,
    email: member.email,
    imageUrl: member.imageUrl,
    isLeader: member.isLeader,
    vitality: 0,
    rhythmConsistency: 0,
    moodTrend: 'none',
    moodAvg: null,
    lastActive: null,
    daysSinceActive: null,
    topStruggle: null,
    attention: false,
    attentionReasons: [],
    hasData: false,
  };
}

function emptyGroup(memberCount: number): GroupAnalytics {
  return {
    memberCount,
    activeThisWeek: 0,
    avgVitality: 0,
    moodAvg: null,
    moodTrend: 'none',
    areaAverages: [],
    strugglingAreas: [],
    strongAreas: [],
    guidance: [],
  };
}

/* ---- row shapes ---- */

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

/* ============================================================
   Group computation across an arbitrary set of members.
   ============================================================ */

export async function computeGroup(
  members: OrgMember[],
): Promise<{ summaries: MemberSummary[]; group: GroupAnalytics }> {
  if (members.length === 0) return { summaries: [], group: emptyGroup(0) };
  const memberIds = members.map((m) => m.userId);

  try {
    const sb = getSupabase();
    const since = lastNDays(30)[0];

    const [areaRes, practiceRes, moodRes] = await Promise.all([
      sb.from('progress_areas').select('id, clerk_user_id, name, preset_key, color, target_score').in('clerk_user_id', memberIds),
      sb.from('practices').select('id, clerk_user_id, name, color, cadence, target_per_week').eq('archived', false).in('clerk_user_id', memberIds),
      sb.from('mood_checkins').select('clerk_user_id, mood, checked_at').in('clerk_user_id', memberIds).gte('checked_at', since),
    ]);

    const areaRows = (areaRes.data as AreaRow[] | null) ?? [];
    const practiceRows = (practiceRes.data as PracticeRow[] | null) ?? [];
    const moodRows = (moodRes.data as MoodRow[] | null) ?? [];

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
      const sinceActive = daysSince(lastActive);

      const scored = areas.filter((a) => a.latest !== null);
      const weakest = scored.slice().sort((a, b) => (a.latest ?? 99) - (b.latest ?? 99))[0];
      const hasData = lastActive !== null;
      const attentionReasons = attentionFor({ moodTrend, daysSinceActive: sinceActive, vitality, hasData });

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
        daysSinceActive: sinceActive,
        topStruggle: weakest ? weakest.name : null,
        attention: attentionReasons.length > 0,
        attentionReasons,
        hasData,
      };
    }

    const summaries = members.map(summaryFor);

    const withData = summaries.filter((m) => m.hasData);
    const avgVitality = withData.length ? withData.reduce((a, b) => a + b.vitality, 0) / withData.length : 0;
    const activeThisWeek = summaries.filter((m) => m.daysSinceActive !== null && m.daysSinceActive <= 6).length;
    const moodAvgs = summaries.map((m) => m.moodAvg).filter((v): v is number => v !== null);
    const moodAvg = moodAvgs.length ? moodAvgs.reduce((a, b) => a + b, 0) / moodAvgs.length : null;
    const ups = summaries.filter((m) => m.moodTrend === 'up').length;
    const downs = summaries.filter((m) => m.moodTrend === 'down').length;
    const groupMoodTrend: Trend = ups === 0 && downs === 0 ? 'none' : downs > ups ? 'down' : ups > downs ? 'up' : 'steady';

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

    const group: GroupAnalytics = {
      memberCount: summaries.length,
      activeThisWeek,
      avgVitality,
      moodAvg,
      moodTrend: groupMoodTrend,
      areaAverages,
      strugglingAreas,
      strongAreas,
      guidance: guidanceForGroup({ strugglingAreas, moodTrend: groupMoodTrend, activeThisWeek, memberCount: summaries.length }),
    };

    return { summaries, group };
  } catch (err) {
    console.error('computeGroup failed', err);
    return { summaries: members.map(blankSummary), group: emptyGroup(members.length) };
  }
}

/* ============================================================
   Single member detail.
   ============================================================ */

export async function computeMemberDetail(member: OrgMember): Promise<MemberDetail | null> {
  const memberId = member.userId;
  try {
    const sb = getSupabase();
    const since = lastNDays(30)[0];

    const [areaRes, practiceRes, moodRes, prayerRes, sharedRes, memoryRes, communityRes] = await Promise.all([
      sb.from('progress_areas').select('id, clerk_user_id, name, preset_key, color, target_score').eq('clerk_user_id', memberId),
      sb.from('practices').select('id, clerk_user_id, name, color, cadence, target_per_week').eq('archived', false).eq('clerk_user_id', memberId),
      sb.from('mood_checkins').select('clerk_user_id, mood, checked_at').eq('clerk_user_id', memberId).gte('checked_at', since).order('checked_at', { ascending: true }),
      sb.from('prayer_requests').select('status').eq('clerk_user_id', memberId),
      sb.from('prayer_requests').select('title, body, status').eq('clerk_user_id', memberId).eq('shared', true).order('created_at', { ascending: false }),
      sb.from('memory_verses').select('id, reference, verse_text, translation, status, reviews').eq('clerk_user_id', memberId).order('created_at', { ascending: false }),
      sb.from('community_prayers').select('id, title, body, pray_count, answered').eq('clerk_user_id', memberId).order('created_at', { ascending: false }),
    ]);

    const areaRows = (areaRes.data as AreaRow[] | null) ?? [];
    const practiceRows = (practiceRes.data as PracticeRow[] | null) ?? [];
    const moodRows = (moodRes.data as MoodRow[] | null) ?? [];
    const prayerRows = (prayerRes.data as { status: string }[] | null) ?? [];
    const sharedRows = (sharedRes.data as { title: string; body: string; status: string }[] | null) ?? [];
    const memoryRows =
      (memoryRes.data as {
        id: string;
        reference: string;
        verse_text: string;
        translation: string;
        status: string;
        reviews: number;
      }[] | null) ?? [];
    const communityRows =
      (communityRes.data as {
        id: string;
        title: string;
        body: string;
        pray_count: number;
        answered: boolean;
      }[] | null) ?? [];

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
    const sinceActive = daysSince(lastActive);

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
    const attentionReasons = attentionFor({ moodTrend, daysSinceActive: sinceActive, vitality, hasData });

    const guidance = guidanceForMember({
      name: member.name,
      areas,
      moodTrend,
      daysSinceActive: sinceActive,
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
      daysSinceActive: sinceActive,
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
      verses: memoryRows.map((v) => ({
        id: v.id,
        reference: v.reference,
        text: v.verse_text,
        translation: v.translation,
        status: v.status === 'memorized' ? 'memorized' : 'learning',
        reviews: v.reviews,
      })),
      community: communityRows.map((c) => ({
        id: c.id,
        title: c.title,
        body: c.body,
        prayCount: c.pray_count,
        answered: c.answered,
      })),
      guidance,
    };
  } catch (err) {
    console.error('computeMemberDetail failed', err);
    return null;
  }
}
