import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { getSupabase, type DashboardPrefs } from '@/lib/supabase';
import { weekCompletions } from '@/lib/dashboard/streaks';
import {
  computeJourney,
  withRevealAll,
  stageRank,
  fallbackJourneyView,
  type JourneySignals,
  type JourneyView,
} from '@/lib/dashboard/journey';

/**
 * The server side of the journey: ensure the member's prefs row exists, gather
 * the engagement + attendance signals (all measured SINCE their journey began),
 * and hand the pure engine the numbers. Wrapped in React cache() so the layout
 * and the page it renders share one computation per request.
 *
 * Reads only. Mutations live in the prefs/attendance action files.
 */

/** Create the prefs row on first load (defaults set the journey clock to now). */
async function ensurePrefs(userId: string): Promise<DashboardPrefs> {
  const sb = getSupabase();

  const existing = await sb
    .from('dashboard_prefs')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (existing.data) return existing.data as DashboardPrefs;

  const created = await sb
    .from('dashboard_prefs')
    .insert({ clerk_user_id: userId })
    .select()
    .single();
  if (created.data) return created.data as DashboardPrefs;

  // Lost a race with a parallel request that created the row first.
  const again = await sb
    .from('dashboard_prefs')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (again.data) return again.data as DashboardPrefs;

  throw created.error ?? new Error('Could not create dashboard_prefs');
}

function dayKey(s: string): string {
  return s.slice(0, 10);
}

async function gatherSignals(
  userId: string,
  orgId: string | null,
  startedAtISO: string,
): Promise<JourneySignals> {
  const sb = getSupabase();
  const startDate = dayKey(startedAtISO);
  const daysSinceStart = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAtISO).getTime()) / 86_400_000),
  );

  // The user's progress areas and active practices (their ids drive two follow-ups).
  const [areaRes, practiceRes] = await Promise.all([
    sb.from('progress_areas').select('id').eq('clerk_user_id', userId),
    sb
      .from('practices')
      .select('id, cadence')
      .eq('archived', false)
      .eq('clerk_user_id', userId),
  ]);
  const areaIds = ((areaRes.data as { id: string }[] | null) ?? []).map((a) => a.id);
  const practiceRows = (practiceRes.data as { id: string; cadence: string }[] | null) ?? [];
  const practiceIds = practiceRows.map((p) => p.id);
  const dailyIds = new Set(practiceRows.filter((p) => p.cadence === 'daily').map((p) => p.id));

  const empty = Promise.resolve({ data: [] as Record<string, unknown>[], count: 0 });
  const emptyCount = Promise.resolve({ count: 0 });

  const [
    entriesRes,
    logsRes,
    moodRes,
    gratRes,
    reflRes,
    thoughtRes,
    prayerRes,
    verseRes,
    communityRes,
    intercessRes,
    attendanceRes,
  ] = await Promise.all([
    areaIds.length
      ? sb.from('progress_entries').select('logged_at').in('area_id', areaIds).gte('logged_at', startedAtISO)
      : empty,
    practiceIds.length
      ? sb.from('practice_logs').select('practice_id, done_on').in('practice_id', practiceIds).gte('done_on', startDate)
      : empty,
    sb.from('mood_checkins').select('checked_at').eq('clerk_user_id', userId).gte('checked_at', startedAtISO),
    sb.from('gratitude_entries').select('entry_date').eq('clerk_user_id', userId).gte('entry_date', startDate),
    sb.from('reflections').select('entry_date').eq('clerk_user_id', userId).gte('entry_date', startDate),
    sb.from('thought_records').select('created_at').eq('clerk_user_id', userId).gte('created_at', startedAtISO),
    sb.from('prayer_requests').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).gte('created_at', startedAtISO),
    sb.from('memory_verses').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).gte('created_at', startedAtISO),
    sb.from('community_prayers').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).gte('created_at', startedAtISO),
    sb.from('community_intercessions').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).gte('created_at', startedAtISO),
    orgId
      ? sb.from('group_attendance').select('gathering_date').eq('clerk_user_id', userId).eq('confirmed', true).gte('gathering_date', startDate)
      : empty,
  ]);

  const entryRows = (entriesRes.data as { logged_at: string }[] | null) ?? [];
  const logRows = (logsRes.data as { practice_id: string; done_on: string }[] | null) ?? [];
  const moodRows = (moodRes.data as { checked_at: string }[] | null) ?? [];
  const gratRows = (gratRes.data as { entry_date: string }[] | null) ?? [];
  const reflRows = (reflRes.data as { entry_date: string }[] | null) ?? [];
  const thoughtRows = (thoughtRes.data as { created_at: string }[] | null) ?? [];

  const reflectionCount = moodRows.length + gratRows.length + reflRows.length + thoughtRows.length;
  const progressEntryCount = entryRows.length;
  const prayerCount = prayerRes.count ?? 0;
  const verseCount = verseRes.count ?? 0;
  const communityCount = (communityRes.count ?? 0) + (intercessRes.count ?? 0);

  // Distinct calendar days with any logged activity since start.
  const activeDaySet = new Set<string>();
  for (const r of entryRows) activeDaySet.add(dayKey(r.logged_at));
  for (const r of logRows) activeDaySet.add(dayKey(r.done_on));
  for (const r of moodRows) activeDaySet.add(dayKey(r.checked_at));
  for (const r of gratRows) activeDaySet.add(dayKey(r.entry_date));
  for (const r of reflRows) activeDaySet.add(dayKey(r.entry_date));
  for (const r of thoughtRows) activeDaySet.add(dayKey(r.created_at));

  // This week's daily-rhythm slots kept (summed across daily practices).
  const logsByPractice = new Map<string, string[]>();
  for (const l of logRows) {
    const list = logsByPractice.get(l.practice_id) ?? [];
    list.push(l.done_on);
    logsByPractice.set(l.practice_id, list);
  }
  let rhythmsKeptThisWeek = 0;
  for (const id of dailyIds) rhythmsKeptThisWeek += weekCompletions(logsByPractice.get(id) ?? []);

  // Distinct confirmed in-person weeks.
  const attendanceRows = (attendanceRes.data as { gathering_date: string }[] | null) ?? [];
  const confirmedWeeks = new Set(attendanceRows.map((r) => dayKey(r.gathering_date))).size;

  void emptyCount; // (kept for clarity; head-count queries return their own shape)

  return {
    daysSinceStart,
    confirmedWeeks,
    activeDays: activeDaySet.size,
    rhythmsKeptThisWeek,
    reflectionCount,
    progressEntryCount,
    prayerCount,
    verseCount,
    communityCount,
  };
}

/**
 * Compute the member's journey view for this request. Cached so the layout and
 * page share it. Always returns something usable, even on failure.
 */
export const getJourney = cache(async (): Promise<JourneyView> => {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return fallbackJourneyView();

    const prefs = await ensurePrefs(userId);
    const signals = await gatherSignals(userId, orgId ?? null, prefs.journey_started_at);
    // Floor the journey at the high-water mark so growth only ever moves forward.
    const journey = computeJourney(signals, prefs.journey_seen_stage);
    const sections = withRevealAll(journey.sections, prefs.reveal_all);
    const crossedInto =
      stageRank(journey.stage) > stageRank(prefs.journey_seen_stage) ? journey.stage : null;

    return {
      journey,
      sections,
      revealAll: prefs.reveal_all,
      welcomeSeen: prefs.welcome_seen,
      seenStage: prefs.journey_seen_stage,
      crossedInto,
    };
  } catch (err) {
    console.error('getJourney failed', err);
    return fallbackJourneyView();
  }
});
