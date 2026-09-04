import { getSupabase, type EventRow, type GoogleConnectionRow, type CalendarPushRow } from '@/lib/supabase';
import { orgsForUser, getGroupMembers } from '@/lib/groups/membership';
import { toMemberEvent } from '@/lib/schedule/public-event';
import { appUrl } from '@/lib/dashboard/prefs';
import { decryptText } from '@/lib/security/crypto';
import { safeTz } from '@/lib/notify/rules';
import { SCOPES, refreshAccessToken, revokeToken, isGoogleConfigured } from './oauth';
import {
  createCalendar,
  calendarExists,
  deleteCalendar,
  eventBody,
  insertEvent,
  patchEvent,
  deleteEvent,
  freeBusy,
  intervalsToBusySlots,
} from './calendar';

/**
 * Keeping one member's Google Calendar in step with their groups.
 *
 * Write side: every scheduled event in any of the member's groups appears on
 * the "Christ Fields" calendar this app created; calendar_pushes remembers the
 * Google id and the version we last sent, so a change patches in place and a
 * call-off deletes. Read side: freeBusy over the next 28 days, reduced to
 * (date, slot) rows tagged source='google'.
 *
 * Called from the hourly tick (round-robin, a few members per run), right
 * after a leader's write for that group's connected members (inside a small
 * time box), and once from the OAuth callback. Every caller passes a deadline;
 * a run that stops early leaves the rest for the next tick, because each
 * success is recorded as it happens.
 *
 * Status rules: only `invalid_grant` (the member removed us at Google) makes
 * a row 'revoked', and only an unreadable stored token makes it 'error'. A
 * timeout or a Google 5xx just records last_error and moves the member to the
 * back of the queue.
 */

const DAY = 86_400_000;
const LOOKBACK_MS = 1 * DAY;
const LOOKAHEAD_MS = 120 * DAY;
const CANCELLED_KEEP_MS = 14 * DAY;
const BUSY_DAYS = 28;
const DEFAULT_MAX_CALLS = 40;
const PENDING_PUSH = 'pending';
const STALE_PENDING_MS = 10 * 60_000;

export interface SyncOptions {
  nowMs?: number;
  deadline?: () => boolean;
  maxCalls?: number;
  /** Only refresh free/busy (a leader's Refresh); leave the calendar mirror to the tick. */
  busyOnly?: boolean;
  /** Per-request socket timeout, so a caller with a small time box can keep it. */
  timeoutMs?: number;
}

export interface SyncOutcome {
  /** True when everything attempted succeeded (partial runs are not ok). */
  ok: boolean;
  pushed: number;
  removed: number;
  busy: number;
  /** True only when free/busy was actually read from Google this run. */
  busyRead: boolean;
  error?: string;
}

function has(conn: GoogleConnectionRow, scope: string): boolean {
  return conn.scopes.includes(scope);
}

async function finish(userId: string, nowMs: number, patch: Partial<GoogleConnectionRow>): Promise<void> {
  const sb = getSupabase();
  await sb
    .from('google_connections')
    .update({ ...patch, last_freebusy_at: new Date(nowMs).toISOString(), updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId);
}

export async function syncMemberCalendar(userId: string, opts: SyncOptions = {}): Promise<SyncOutcome> {
  const nowMs = opts.nowMs ?? Date.now();
  const deadline = opts.deadline ?? (() => false);
  const maxCalls = opts.maxCalls ?? DEFAULT_MAX_CALLS;
  const timeoutMs = opts.timeoutMs ?? 8_000;
  const none: SyncOutcome = { ok: false, pushed: 0, removed: 0, busy: 0, busyRead: false };
  if (!isGoogleConfigured()) return { ...none, error: 'not configured' };
  const sb = getSupabase();
  const { data } = await sb.from('google_connections').select('*').eq('clerk_user_id', userId).maybeSingle();
  const conn = data as GoogleConnectionRow | null;
  if (!conn || conn.status !== 'ok') return { ...none, error: conn ? conn.status : 'no connection' };

  const refreshToken = decryptText(conn.refresh_token_enc);
  if (!refreshToken) {
    // Deterministic: the key changed or the row is corrupt. Only a reconnect fixes it.
    await finish(userId, nowMs, { status: 'error', last_error: 'could not read the stored token' });
    return { ...none, error: 'token unreadable' };
  }
  const token = await refreshAccessToken(refreshToken, timeoutMs);
  if (!token.ok) {
    if (token.revoked) await finish(userId, nowMs, { status: 'revoked', last_error: token.error.slice(0, 200) });
    else await finish(userId, nowMs, { last_error: token.error.slice(0, 200) }); // transient: try again later
    return { ...none, error: token.error };
  }
  const access = token.accessToken;
  const out: SyncOutcome = { ok: true, pushed: 0, removed: 0, busy: 0, busyRead: false };
  const errors: string[] = [];

  const { data: prefs } = await sb.from('member_prefs').select('tz').eq('clerk_user_id', userId).maybeSingle();
  const tz = safeTz((prefs as { tz: string } | null)?.tz, 'America/Denver');

  /* ---------------- write side ---------------- */
  if (has(conn, SCOPES.write) && !opts.busyOnly) {
    let calendarId: string | null = conn.cf_calendar_id;
    let skipWrite = false;
    let check: 'exists' | 'gone' | 'unknown' = 'gone';
    if (calendarId) {
      check = await calendarExists(access, calendarId);
      if (check === 'unknown') {
        // Could be a timeout or a scope problem. Never rebuild on a guess.
        errors.push('calendar check failed');
        skipWrite = true;
      }
    }
    if (!skipWrite && (!calendarId || check === 'gone')) {
      const created = await createCalendar(access, tz);
      if (!created) {
        errors.push('could not create the Christ Fields calendar');
        skipWrite = true;
      } else {
        // Only now, with the replacement in hand, forget the old calendar's pushes.
        if (calendarId && check === 'gone') await sb.from('calendar_pushes').delete().eq('clerk_user_id', userId);
        calendarId = created;
        await sb
          .from('google_connections')
          .update({ cf_calendar_id: calendarId, updated_at: new Date().toISOString() })
          .eq('clerk_user_id', userId);
      }
    }

    if (!skipWrite && calendarId) {
      const cal = calendarId;
      const orgs = await orgsForUser(userId);
      const orgIds = orgs.map((o) => o.orgId);
      const names = new Map(orgs.map((o) => [o.orgId, o.orgName]));
      if (orgIds.length > 0) {
        const [scheduledRes, cancelledRes, pushRes] = await Promise.all([
          sb
            .from('events')
            .select('*')
            .in('org_id', orgIds)
            .eq('status', 'scheduled')
            .gte('starts_at', new Date(nowMs - LOOKBACK_MS).toISOString())
            .lte('starts_at', new Date(nowMs + LOOKAHEAD_MS).toISOString())
            .order('starts_at', { ascending: true })
            .limit(300),
          sb
            .from('events')
            .select('*')
            .in('org_id', orgIds)
            .eq('status', 'cancelled')
            .gte('cancelled_at', new Date(nowMs - CANCELLED_KEEP_MS).toISOString())
            .limit(100),
          sb.from('calendar_pushes').select('*').eq('clerk_user_id', userId),
        ]);
        const events = [
          ...((cancelledRes.data as EventRow[] | null) ?? []),
          ...((scheduledRes.data as EventRow[] | null) ?? []),
        ];
        const pushes = new Map(((pushRes.data as CalendarPushRow[] | null) ?? []).map((p) => [p.event_id, p]));
        const base = appUrl();
        let calls = 0;

        const savePush = (eventId: string, googleId: string, version: number) =>
          sb
            .from('calendar_pushes')
            .update({ google_event_id: googleId, event_version: version, pushed_at: new Date().toISOString() })
            .eq('event_id', eventId)
            .eq('clerk_user_id', userId);

        for (const e of events) {
          if (calls >= maxCalls || deadline()) {
            errors.push('partial');
            break;
          }
          let pushed = pushes.get(e.id);

          // Another run is inserting this one right now, unless it died mid-way.
          if (pushed?.google_event_id === PENDING_PUSH) {
            if (nowMs - Date.parse(pushed.pushed_at) < STALE_PENDING_MS) continue;
            await sb.from('calendar_pushes').delete().eq('event_id', e.id).eq('clerk_user_id', userId);
            pushed = undefined;
          }

          if (e.status === 'cancelled') {
            if (!pushed) continue;
            calls += 1;
            if (await deleteEvent(access, cal, pushed.google_event_id)) {
              await sb.from('calendar_pushes').delete().eq('event_id', e.id).eq('clerk_user_id', userId);
              out.removed += 1;
            }
            continue;
          }

          const body = eventBody(toMemberEvent(e, names.get(e.org_id) ?? 'Our group'), base);
          if (!pushed) {
            // Claim the row first so a concurrent run cannot insert the same event twice.
            const { data: claimed } = await sb
              .from('calendar_pushes')
              .upsert(
                { event_id: e.id, clerk_user_id: userId, google_event_id: PENDING_PUSH, event_version: -1, pushed_at: new Date().toISOString() },
                { onConflict: 'event_id,clerk_user_id', ignoreDuplicates: true },
              )
              .select('event_id');
            if (!claimed || claimed.length === 0) continue;
            calls += 1;
            const id = await insertEvent(access, cal, body);
            if (id) {
              await savePush(e.id, id, e.version ?? 0);
              out.pushed += 1;
            } else {
              await sb.from('calendar_pushes').delete().eq('event_id', e.id).eq('clerk_user_id', userId);
            }
          } else if ((e.version ?? 0) > pushed.event_version) {
            calls += 1;
            const r = await patchEvent(access, cal, pushed.google_event_id, body);
            let googleId = pushed.google_event_id;
            let done = r === 'ok';
            if (r === 'gone') {
              calls += 1;
              const id = await insertEvent(access, cal, body);
              if (id) {
                googleId = id;
                done = true;
              }
            }
            if (done) {
              await savePush(e.id, googleId, e.version ?? 0);
              out.pushed += 1;
            }
          }
        }
      }
    }
  }

  /* ---------------- read side ---------------- */
  if (has(conn, SCOPES.busy)) {
    if (deadline()) {
      errors.push('partial');
    } else {
      const d = new Date(nowMs);
      const fromMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - DAY;
      const toMs = fromMs + (BUSY_DAYS + 1) * DAY;
      const intervals = await freeBusy(access, tz, new Date(fromMs).toISOString(), new Date(toMs).toISOString(), timeoutMs);
      if (intervals) {
        const slots = intervalsToBusySlots(intervals, tz, fromMs, toMs);
        await sb.from('calendar_busy').delete().eq('clerk_user_id', userId).eq('source', 'google');
        if (slots.length > 0) {
          await sb
            .from('calendar_busy')
            .insert(slots.map((s) => ({ clerk_user_id: userId, on_date: s.date, slot: s.slot, source: 'google' })));
        }
        out.busy = slots.length;
        out.busyRead = true;
      } else {
        errors.push('free/busy read failed');
      }
    }
  }

  if (errors.length) {
    out.error = errors.join('; ');
    out.ok = false;
  }
  // last_freebusy_at is the queue stamp for the hourly round-robin, not proof of a read (see busyRead).
  await finish(userId, nowMs, { last_error: out.error ?? null });
  return out;
}

/** The tick: a few members per hour, the ones waited longest first. */
export async function googleTick(nowMs: number, deadline: () => boolean, limit = 5): Promise<number> {
  if (!isGoogleConfigured()) return 0;
  const sb = getSupabase();
  const { data } = await sb
    .from('google_connections')
    .select('clerk_user_id')
    .eq('status', 'ok')
    .order('last_freebusy_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  let did = 0;
  for (const row of (data as { clerk_user_id: string }[] | null) ?? []) {
    if (deadline()) break;
    const r = await syncMemberCalendar(row.clerk_user_id, { nowMs, deadline });
    if (r.ok) did += 1;
  }
  return did;
}

/**
 * Right after a leader's write: mirror it for this group's connected members
 * inside a small time box. The deadline is checked inside each sync too, so
 * the box holds even when one member has many events; the tick finishes.
 */
export async function syncOrgCalendars(orgId: string, budgetMs = 4_000): Promise<number> {
  if (!isGoogleConfigured()) return 0;
  try {
    const until = Date.now() + budgetMs;
    const deadline = () => Date.now() > until;
    const members = await getGroupMembers(orgId);
    if (members.length === 0) return 0;
    const sb = getSupabase();
    const { data } = await sb
      .from('google_connections')
      .select('clerk_user_id, scopes')
      .eq('status', 'ok')
      .in('clerk_user_id', members.map((m) => m.userId))
      .limit(10);
    let did = 0;
    for (const row of (data as { clerk_user_id: string; scopes: string[] }[] | null) ?? []) {
      if (deadline()) break;
      if (!row.scopes.includes(SCOPES.write)) continue;
      const r = await syncMemberCalendar(row.clerk_user_id, { deadline, maxCalls: 8 });
      if (r.ok) did += 1;
    }
    return did;
  } catch (err) {
    console.error('syncOrgCalendars failed', err);
    return 0;
  }
}

/**
 * Undo everything: our calendar on their Google, our token, our rows.
 * `calendarRemoved` is null when there was no calendar to remove, false when
 * Google could not be reached (the member is told to delete it by hand).
 */
export async function disconnectGoogle(userId: string): Promise<{ ok: boolean; calendarRemoved: boolean | null }> {
  const sb = getSupabase();
  const { data } = await sb.from('google_connections').select('*').eq('clerk_user_id', userId).maybeSingle();
  const conn = data as GoogleConnectionRow | null;
  let calendarRemoved: boolean | null = null;
  if (conn) {
    const refreshToken = decryptText(conn.refresh_token_enc);
    if (refreshToken) {
      if (conn.cf_calendar_id && has(conn, SCOPES.write)) {
        const token = await refreshAccessToken(refreshToken);
        calendarRemoved = token.ok ? await deleteCalendar(token.accessToken, conn.cf_calendar_id) : token.revoked ? null : false;
      }
      await revokeToken(refreshToken);
    }
  }
  await Promise.all([
    sb.from('calendar_pushes').delete().eq('clerk_user_id', userId),
    sb.from('calendar_busy').delete().eq('clerk_user_id', userId).eq('source', 'google'),
    sb.from('google_connections').delete().eq('clerk_user_id', userId),
  ]);
  return { ok: true, calendarRemoved };
}
