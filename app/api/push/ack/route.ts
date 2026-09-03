import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';
import { isBodyTooLarge } from '@/lib/security/origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The device says "I showed it". Called by public/sw.js after every
 * notification. No session (a service worker has none we trust); the endpoint
 * itself is an unguessable URL from the push service, and the only effect is
 * to mark that row alive. Outside the Clerk middleware on purpose.
 */

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 2_048)) return NextResponse.json({ ok: false }, { status: 413 });
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown')
    .split(',')[0]
    .trim();
  const limit = await takeRateLimit(`push-ack:${ip}`, 120, 600);
  if (!limit.allowed) return NextResponse.json({ ok: false }, { status: 429 });

  let endpoint = '';
  try {
    const body = (await req.json()) as { endpoint?: unknown };
    if (typeof body.endpoint === 'string') endpoint = body.endpoint;
  } catch {
    // fall through
  }
  if (!endpoint.startsWith('https://') || endpoint.length > 1024) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const sb = getSupabase();
  await sb
    .from('push_subscriptions')
    .update({ last_ok_at: new Date().toISOString(), fail_count: 0 })
    .eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
