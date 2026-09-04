import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabase, type EventRow } from '@/lib/supabase';
import { userIsMemberOf, orgName } from '@/lib/groups/membership';
import { toMemberEvent } from '@/lib/schedule/public-event';
import { buildEventIcs } from '@/lib/schedule/ics-export';
import { verifyToken } from '@/lib/notify/tokens';
import { appUrl } from '@/lib/dashboard/prefs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One event as an .ics file, for Apple Calendar and Outlook.
 *
 * Two ways in: a signed-in member of the event's group, or a `?t=` token minted
 * for reminder emails (a calendar app opening the link from an email has no
 * session). Either way the member must belong to the org, and the payload goes
 * through toMemberEvent so leader-only fields never leave the server.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let userId: string | null = null;
  const token = req.nextUrl.searchParams.get('t');
  if (token) {
    const claims = verifyToken(token, 'ics');
    if (!claims || claims.eventId !== id) return NextResponse.json({ error: 'Link expired' }, { status: 403 });
    userId = claims.userId;
  } else {
    try {
      const a = await auth();
      userId = a.userId ?? null;
    } catch {
      userId = null;
    }
  }
  if (!userId) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const sb = getSupabase();
  const { data } = await sb.from('events').select('*').eq('id', id).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = data as EventRow;
  if (!(await userIsMemberOf(userId, row.org_id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ics = buildEventIcs(toMemberEvent(row, await orgName(row.org_id)), appUrl());
  const safeName = row.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event';
  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}.ics"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
