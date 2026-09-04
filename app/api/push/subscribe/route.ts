import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabase } from '@/lib/supabase';
import { isCrossSite, isBodyTooLarge } from '@/lib/security/origin';
import { PUSH_MAX_PER_MEMBER } from '@/lib/notify/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Save or remove this device's push subscription. Under the Clerk middleware
 * (see middleware.ts) so auth() sees the session; a subscription is only ever
 * tied to the signed-in member.
 *
 * Liveness stays honest: a brand-new endpoint starts alive; re-posting an
 * endpoint we already know does NOT reset its failure count or bump its ack
 * time (only a real device ack does). A different member taking over a
 * device's endpoint re-owns it and starts it fresh.
 */

interface Body {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  endpoint?: string;
  userAgent?: string;
}

async function readBody(req: Request): Promise<Body | null> {
  if (isBodyTooLarge(req, 8_192)) return null;
  try {
    return (await req.json()) as Body;
  } catch {
    return null;
  }
}

function validEndpoint(e: unknown): e is string {
  return typeof e === 'string' && e.startsWith('https://') && e.length <= 1024;
}

export async function POST(req: Request) {
  if (isCrossSite(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await readBody(req);
  const sub = body?.subscription;
  if (!sub || !validEndpoint(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: 'bad subscription' }, { status: 400 });
  }
  const sb = getSupabase();
  const now = new Date().toISOString();
  const keys = {
    p256dh: String(sub.keys.p256dh).slice(0, 256),
    auth: String(sub.keys.auth).slice(0, 128),
    user_agent: String(body?.userAgent || req.headers.get('user-agent') || '').slice(0, 200),
  };

  const { data: existing } = await sb
    .from('push_subscriptions')
    .select('id, clerk_user_id')
    .eq('endpoint', sub.endpoint)
    .maybeSingle();
  const row = existing as { id: string; clerk_user_id: string } | null;

  let error;
  if (row) {
    const reowned = row.clerk_user_id !== userId;
    ({ error } = await sb
      .from('push_subscriptions')
      .update({ clerk_user_id: userId, ...keys, ...(reowned ? { last_ok_at: now, fail_count: 0 } : {}) })
      .eq('id', row.id));
  } else {
    ({ error } = await sb
      .from('push_subscriptions')
      .insert({ clerk_user_id: userId, endpoint: sub.endpoint, ...keys, last_ok_at: now, fail_count: 0 }));
  }
  if (error) {
    console.error('push subscribe failed', error);
    return NextResponse.json({ error: 'could not save' }, { status: 500 });
  }

  // A member keeps at most a handful of devices; drop the oldest beyond that.
  const { data: mine } = await sb
    .from('push_subscriptions')
    .select('id')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false });
  const extra = ((mine as { id: string }[] | null) ?? []).slice(PUSH_MAX_PER_MEMBER).map((r) => r.id);
  if (extra.length > 0) await sb.from('push_subscriptions').delete().in('id', extra);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (isCrossSite(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await readBody(req);
  if (!validEndpoint(body?.endpoint)) return NextResponse.json({ error: 'bad endpoint' }, { status: 400 });
  const sb = getSupabase();
  await sb.from('push_subscriptions').delete().eq('endpoint', body!.endpoint!).eq('clerk_user_id', userId);
  return NextResponse.json({ ok: true });
}
