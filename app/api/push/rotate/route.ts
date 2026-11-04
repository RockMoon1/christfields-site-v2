import {validPushEndpoint as validEndpoint,validPushKeys} from '@/lib/security/push-endpoint';
import {boundedText} from '@/lib/security/body';
import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';
import { isBodyTooLarge } from '@/lib/security/origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The push service rotated a device's subscription while no page was open
 * (the service worker's pushsubscriptionchange). A service worker has no
 * session we can trust, so this route is outside the Clerk middleware and
 * proves ownership the only way it can: knowledge of the OLD endpoint, an
 * unguessable URL only that device and this database ever held. The row keeps
 * its member and swaps the endpoint and keys.
 */

interface Body {
  oldEndpoint?: unknown;
  subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
}


export async function POST(req: Request) {
  if (isBodyTooLarge(req, 8_192)) return NextResponse.json({ ok: false }, { status: 413 });
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown')
    .split(',')[0]
    .trim();
  const limit = await takeRateLimit(`push-rotate:${ip}`, 30, 600);
  if (!limit.durable || !limit.allowed) return NextResponse.json({ ok: false }, { status: 429 });

  let body: Body;
  try {
    body = (JSON.parse(await boundedText(req.body,8192))) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const sub = body?.subscription;
  if (!validEndpoint(body?.oldEndpoint) || !sub || !validEndpoint(sub.endpoint) || !validPushKeys(sub.keys)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const sb = getSupabase();
  const { data } = await sb.from('push_subscriptions').select('id').eq('endpoint', body.oldEndpoint).maybeSingle();
  if (!data) return NextResponse.json({ ok: false }, { status: 404 });

  const now = new Date().toISOString();
  const { error } = await sb
    .from('push_subscriptions')
    .update({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh.slice(0, 256),
      auth: sub.keys.auth.slice(0, 128),
      last_ok_at: now,
      fail_count: 0,
    })
    .eq('id', (data as { id: string }).id).eq('endpoint',body.oldEndpoint);
  if (error?.code === '23505') {
    // The new endpoint already has a row (re-subscribed from a page first): drop the stale one.
    await sb.from('push_subscriptions').delete().eq('endpoint', body.oldEndpoint);
  }
  else if(error)return NextResponse.json({ok:false},{status:503});
  return NextResponse.json({ ok: true });
}
