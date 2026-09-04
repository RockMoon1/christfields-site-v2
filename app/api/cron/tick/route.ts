import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabase, type CalendarFeedRow } from '@/lib/supabase';
import { remind24h, remind2h, leaderBriefs, leaderStartPush, prune, type TickReport } from '@/lib/notify/scheduled';
import { syncFeedForUser } from '@/app/dashboard/(app)/availability/actions';
import { decryptText } from '@/lib/security/crypto';
import { googleTick } from '@/lib/google/sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The hourly heartbeat. Driven by netlify/functions/tick.mts (a Netlify
 * Scheduled Function) and, as a backstop, by a weekly GitHub Action. This route
 * lives outside the Clerk middleware; the bearer secret is its whole auth.
 *
 * Budget: about 6 seconds of work, then return { remaining: true } so the
 * driver can call again. Two calls with 10s aborts fit inside Netlify's 30s.
 * The hourly PostgREST traffic doubles as the Supabase free-tier heartbeat.
 */

const BUDGET_MS = 6_000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = req.headers.get('authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function refreshStaleFeeds(nowMs: number, deadline: () => boolean): Promise<number> {
  const sb = getSupabase();
  const { data } = await sb
    .from('calendar_feeds')
    .select('*')
    .lt('last_synced_at', new Date(nowMs - 12 * 3_600_000).toISOString())
    .order('last_synced_at', { ascending: true })
    .limit(5);
  let did = 0;
  for (const f of (data as CalendarFeedRow[] | null) ?? []) {
    if (deadline()) break;
    const url = f.ics_url_enc ? decryptText(f.ics_url_enc) : f.ics_url || null;
    if (!url) continue;
    await syncFeedForUser(f.clerk_user_id, url, f.tz || 'UTC');
    did += 1;
  }
  return did;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const started = Date.now();
  const nowMs = started;
  const deadline = () => Date.now() - started > BUDGET_MS;
  const report: TickReport = {
    reminders24h: 0,
    reminders2h: 0,
    briefs: 0,
    leaderStarts: 0,
    feedsRefreshed: 0,
    googleSynced: 0,
    pruned: {},
    remaining: false,
    ms: 0,
  };

  try {
    // Order matters: the time-sensitive things first.
    report.leaderStarts = await leaderStartPush(nowMs, deadline);
    if (!deadline()) report.reminders2h = await remind2h(nowMs, deadline);
    if (!deadline()) report.reminders24h = await remind24h(nowMs, deadline);
    if (!deadline()) report.briefs = await leaderBriefs(nowMs, deadline);
    if (!deadline()) report.feedsRefreshed = await refreshStaleFeeds(nowMs, deadline);
    if (!deadline()) report.googleSynced = await googleTick(nowMs, deadline);
    // Pruning is cheap and once an hour is plenty; skip it when we are already over budget.
    if (!deadline()) report.pruned = await prune(nowMs);
  } catch (err) {
    console.error('tick failed', err);
  }
  report.remaining = deadline();
  report.ms = Date.now() - started;
  return NextResponse.json(report);
}

export async function GET() {
  return NextResponse.json({ error: 'POST with a bearer token' }, { status: 405 });
}
