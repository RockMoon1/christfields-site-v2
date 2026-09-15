import { NextResponse } from 'next/server';
import { activateDevice, OsintControlNotConfigured, OsintControlPublicError } from '@/lib/osint-control/store';
import { cleanText, isActivationToken, isInstallId } from '@/lib/osint-control/security';
import { isBodyTooLarge, isCrossSite } from '@/lib/security/origin';
import { takeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = 10;
const WINDOW_SECONDS = 10 * 60;

function clientIp(req: Request): string {
  return req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  if (isBodyTooLarge(req, 8_192)) return null;
  try {
    const body = await req.json();
    return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (isCrossSite(req)) return noStore({ ok: false, error: 'forbidden' }, 403);

  const ip = clientIp(req);
  const rl = await takeRateLimit(`osint-activate:${ip}`, LIMIT, WINDOW_SECONDS);
  if (rl.durable && !rl.allowed) return noStore({ ok: false, error: 'Please wait before trying another activation.' }, 429);

  const body = await readBody(req);
  if (!body) return noStore({ ok: false, error: 'Invalid body.' }, 400);

  const activationToken = cleanText(body.activationToken, 140);
  const installId = cleanText(body.installId, 128);
  if (!isActivationToken(activationToken) || !isInstallId(installId)) {
    return noStore({ ok: false, error: 'Activation credentials were not accepted.' }, 400);
  }

  try {
    const result = await activateDevice({
      activationToken,
      installId,
      label: cleanText(body.label, 120),
      contact: cleanText(body.contact, 160),
      platform: cleanText(body.platform, 120),
      appVersion: cleanText(body.appVersion, 40),
      ip,
      userAgent: req.headers.get('user-agent'),
    });
    return noStore({ ok: true, deviceSecret: result.deviceSecret, policy: result.policy });
  } catch (err) {
    if (err instanceof OsintControlNotConfigured) return noStore({ ok: false, error: 'OSINT control is not configured yet.' }, 503);
    if (err instanceof OsintControlPublicError) return noStore({ ok: false, error: 'Activation credentials were not accepted.' }, 403);
    console.error('OSINT activation failed', { name: err instanceof Error ? err.name : 'UnknownError' });
    return noStore({ ok: false, error: 'Activation failed.' }, 500);
  }
}

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
