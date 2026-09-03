'use server';

import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';
import { getSupabase, type EventRow, type EventRsvpRow, type EventRsvpStatus } from '@/lib/supabase';
import { userIsMemberOf, orgName } from '@/lib/groups/membership';
import { toMemberEvent, toFaces, type MemberEvent, type RsvpFace } from '@/lib/schedule/public-event';
import { googleTemplateUrl } from '@/lib/schedule/ics-export';
import { verifyToken } from '@/lib/notify/tokens';
import { takeRateLimit } from '@/lib/rate-limit';
import { whenInWords } from '@/lib/dashboard/format';
import { appUrl } from '@/lib/dashboard/prefs';

/**
 * Answer from a link with no session. The token (HMAC over event, member,
 * expiry) arrives in the URL fragment and is posted here; nothing mutates on
 * GET. Every call re-verifies the signature, the expiry, the event, and that
 * the member still belongs to its group.
 */

export interface TokenView {
  event: MemberEvent;
  whenText: string;
  googleUrl: string;
  myStatus: EventRsvpStatus | null;
  myPlan: string;
  faces: RsvpFace[];
  token: string;
}

async function ip(): Promise<string> {
  const h = await headers();
  return (h.get('x-nf-client-connection-ip') || h.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

async function resolve(token: string, eventId: string): Promise<{ userId: string; event: EventRow } | null> {
  const claims = verifyToken(token);
  if (!claims || claims.eventId !== eventId) return null;
  const sb = getSupabase();
  const { data } = await sb.from('events').select('*').eq('id', eventId).maybeSingle();
  if (!data) return null;
  const event = data as EventRow;
  if (!(await userIsMemberOf(claims.userId, event.org_id))) return null;
  return { userId: claims.userId, event };
}

export async function viewByToken(token: string, eventId: string): Promise<TokenView | null> {
  try {
    const limit = await takeRateLimit(`rsvp-view:${await ip()}`, 60, 600);
    if (!limit.allowed) return null;
    const r = await resolve(token, eventId);
    if (!r) return null;
    const sb = getSupabase();
    const { data } = await sb.from('event_rsvps').select('*').eq('event_id', eventId);
    const rsvps = (data as EventRsvpRow[] | null) ?? [];
    const mine = rsvps.find((x) => x.clerk_user_id === r.userId);
    const event = toMemberEvent(r.event, await orgName(r.event.org_id));
    return {
      event,
      whenText: whenInWords(event.startsAt, event.tz),
      googleUrl: googleTemplateUrl(event, appUrl()),
      myStatus: mine?.status ?? null,
      myPlan: mine?.plan ?? '',
      faces: toFaces(rsvps),
      token,
    };
  } catch (err) {
    console.error('viewByToken failed', err);
    return null;
  }
}

function isRsvpStatus(v: string): v is EventRsvpStatus {
  return v === 'going' || v === 'maybe' || v === 'not_going';
}

export async function rsvpByToken(token: string, eventId: string, status: string): Promise<{ ok: boolean; faces?: RsvpFace[] }> {
  try {
    if (!isRsvpStatus(status)) return { ok: false };
    const limit = await takeRateLimit(`rsvp:${await ip()}`, 30, 600);
    if (!limit.allowed) return { ok: false };
    const r = await resolve(token, eventId);
    if (!r || r.event.status !== 'scheduled') return { ok: false };

    let displayName = 'Member';
    let imageUrl = '';
    try {
      const client = await clerkClient();
      const u = await client.users.getUser(r.userId);
      displayName = u.firstName || u.username || 'Member';
      imageUrl = u.imageUrl || '';
    } catch {
      // Keep going with the fallback name; the answer matters more than the photo.
    }

    const sb = getSupabase();
    const { error } = await sb.from('event_rsvps').upsert(
      {
        event_id: eventId,
        clerk_user_id: r.userId,
        status,
        display_name: displayName.slice(0, 60),
        image_url: imageUrl.slice(0, 500),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,clerk_user_id' },
    );
    if (error) return { ok: false };
    const { data } = await sb.from('event_rsvps').select('*').eq('event_id', eventId);
    return { ok: true, faces: toFaces((data as EventRsvpRow[] | null) ?? []) };
  } catch (err) {
    console.error('rsvpByToken failed', err);
    return { ok: false };
  }
}

const PLANS = new Set(['after_work', 'hour_before', 'unsure', '']);

export async function planByToken(token: string, eventId: string, plan: string): Promise<{ ok: boolean }> {
  try {
    if (!PLANS.has(plan)) return { ok: false };
    const r = await resolve(token, eventId);
    if (!r) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb
      .from('event_rsvps')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('clerk_user_id', r.userId);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
