import { NextResponse } from 'next/server';
import { checkInDevice, OsintControlNotConfigured, OsintControlPublicError } from '@/lib/osint-control/store';
import { cleanText, isDeviceSecret, isInstallId } from '@/lib/osint-control/security';
import { isBodyTooLarge, isCrossSite } from '@/lib/security/origin';
import { takeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const body = await readBody(req);
  if (!body) return noStore({ ok: false, error: 'Invalid body.' }, 400);

  const deviceId = cleanText(body.deviceId, 80);
  const deviceSecret = cleanText(body.deviceSecret, 140);
  const installId = cleanText(body.installId, 128);
  if (!UUID_RE.test(deviceId) || !isDeviceSecret(deviceSecret) || !isInstallId(installId)) {
    return noStore({ ok: false, error: 'Device credentials were not accepted.' }, 401);
  }

  const rl = await takeRateLimit(`osint-check:${deviceId}:${ip}`, 60, 10 * 60);
  if (rl.durable && !rl.allowed) return noStore({ ok: false, error: 'Please wait before checking in again.' }, 429);

  try {
    const policy = await checkInDevice({
      deviceId,
      deviceSecret,
      installId,
      label: cleanText(body.label, 120),
      platform: cleanText(body.platform, 120),
      appVersion: cleanText(body.appVersion, 40),
      ip,
      userAgent: req.headers.get('user-agent'),
    });
    return noStore({ ok: true, policy });
  } catch (err) {
    if (err instanceof OsintControlNotConfigured) return noStore({ ok: false, error: 'OSINT control is not configured yet.' }, 503);
    if (err instanceof OsintControlPublicError) return noStore({ ok: false, error: 'Device credentials were not accepted.' }, 401);
    console.error('OSINT check-in failed', { name: err instanceof Error ? err.name : 'UnknownError' });
    return noStore({ ok: false, error: 'Check-in failed.' }, 500);
  }
}

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
