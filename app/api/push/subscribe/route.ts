import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabase } from '@/lib/supabase';
import { isCrossSite, isBodyTooLarge } from '@/lib/security/origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Save or remove this device's push subscription. Under the Clerk middleware
 * (see middleware.ts) so auth() sees the session; a subscription is only ever
 * tied to the signed-in member. POSTing an existing endpoint re-owns it and
 * counts as a liveness ack.
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
  const { error } = await sb.from('push_subscriptions').upsert(
    {
      clerk_user_id: userId,
      endpoint: sub.endpoint,
      p256dh: String(sub.keys.p256dh).slice(0, 256),
      auth: String(sub.keys.auth).slice(0, 128),
      user_agent: String(body?.userAgent || req.headers.get('user-agent') || '').slice(0, 200),
      last_ok_at: now,
      fail_count: 0,
    },
    { onConflict: 'endpoint' },
  );
  if (error) {
    console.error('push subscribe failed', error);
    return NextResponse.json({ error: 'could not save' }, { status: 500 });
  }
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
