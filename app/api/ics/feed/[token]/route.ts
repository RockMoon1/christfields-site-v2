import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabase, type EventRow } from '@/lib/supabase';
import { orgsForUser } from '@/lib/groups/membership';
import { toMemberEvent } from '@/lib/schedule/public-event';
import { buildFeedIcs } from '@/lib/schedule/ics-export';
import { appUrl } from '@/lib/dashboard/prefs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAST_DAYS = 30;
const FUTURE_DAYS = 120;
const CANCELLED_KEEP_DAYS = 14;

/**
 * A member's whole schedule as a subscribe feed (Google, Apple, Outlook).
 *
 * The token is a private, rotatable bearer for this one member's calendar
 * view. Calendar apps poll these feeds many times a day, so the body stays
 * small, carries an ETag, and answers 304 when nothing changed. It is a
 * convenience, never the notification channel: cancellations arrive by
 * notification and show here as cancelled for two weeks, then drop out.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const clean = (token || '').replace(/\.ics$/i, '');
  if (!clean || clean.length < 20 || clean.length > 128) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sb = getSupabase();
  const { data: prefs } = await sb.from('member_prefs').select('clerk_user_id').eq('feed_token', clean).maybeSingle();
  const userId = (prefs as { clerk_user_id: string } | null)?.clerk_user_id;
  if (!userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const orgs = await orgsForUser(userId);
  if (orgs.length === 0) return icsResponse(buildFeedIcs([], appUrl()), req, 'empty');
  const names = new Map(orgs.map((o) => [o.orgId, o.orgName]));

  const now = Date.now();
  const { data } = await sb
    .from('events')
    .select('*')
    .in('org_id', orgs.map((o) => o.orgId))
    .gte('starts_at', new Date(now - PAST_DAYS * 86_400_000).toISOString())
    .lte('starts_at', new Date(now + FUTURE_DAYS * 86_400_000).toISOString())
    .order('starts_at', { ascending: true })
    .limit(300);
  const rows = ((data as EventRow[] | null) ?? []).filter((e) => {
    if (e.status !== 'cancelled') return true;
    const at = e.cancelled_at ? Date.parse(e.cancelled_at) : 0;
    return now - at < CANCELLED_KEEP_DAYS * 86_400_000;
  });

  const stamp = rows.reduce((m, e) => (e.updated_at > m ? e.updated_at : m), '') + `:${rows.length}`;
  const body = buildFeedIcs(rows.map((e) => toMemberEvent(e, names.get(e.org_id) ?? 'Christ Fields')), appUrl(), new Date(0).toISOString());
  return icsResponse(body, req, stamp);
}

function icsResponse(body: string, req: NextRequest, stamp: string): NextResponse {
  const etag = `"${createHash('sha1').update(stamp).digest('hex')}"`;
  const headers = {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Cache-Control': 'private, max-age=900',
    ETag: etag,
  };
  if (req.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers });
  return new NextResponse(body, { status: 200, headers });
}
