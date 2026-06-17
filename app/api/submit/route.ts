import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { autoReplyHtml, autoReplyText, notificationHtml } from '@/lib/emails';
import { isBodyTooLarge, isCrossSite } from '@/lib/security/origin';
import { takeRateLimit } from '@/lib/rate-limit';

/**
 * Form submission handler for the public site (waitlist + faithflow forms).
 *
 * This sends email directly via Resend instead of relying on Netlify Forms to
 * intercept the POST, which is unreliable inside the Next.js runtime. On each
 * submission it sends:
 *   1. a notification to the Christ Fields inbox (the important one), and
 *   2. a branded thank-you to the person who submitted.
 *
 * Env (set in Netlify):
 *   RESEND_API_KEY   required to actually send
 *   FROM_EMAIL       defaults to "Christ Fields <proverbs@christfields2717.com>"
 *   NOTIFY_EMAIL     where submissions are sent. Defaults to proverbs@christfields2717.com
 *   REPLY_TO_EMAIL   reply-to on the thank-you. Defaults to proverbs@christfields2717.com
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM = process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>';
const NOTIFY = process.env.NOTIFY_EMAIL || 'proverbs@christfields2717.com';
const REPLY_TO = process.env.REPLY_TO_EMAIL || 'proverbs@christfields2717.com';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/**
 * Best-effort in-memory rate limit. On serverless this is per-instance and
 * resets on cold start, so it is not a hard guarantee, but it stops casual
 * abuse, scripted bursts that hit a warm instance, and accidental double
 * submits without adding infrastructure. For a hard global limit, back this
 * with Upstash/Supabase later.
 */
const RATE_LIMIT = 5; // submissions ...
const RATE_WINDOW_MS = 10 * 60 * 1000; // ... per 10 minutes per IP
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get('x-nf-client-connection-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic cleanup so the map cannot grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

export async function POST(req: Request) {
  // CSRF defense-in-depth: reject forged cross-site POSTs from other origins.
  if (isCrossSite(req)) {
    return NextResponse.json({ ok: false, error: 'Cross-site requests are not allowed.' }, { status: 403 });
  }
  // Coarse body-size guard before parsing (fields are length-capped below).
  if (isBodyTooLarge(req, 16_000)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }

  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  // Reject non-object bodies (arrays, primitives) before coercing fields.
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  // Server-side rate limit (every POST counts, regardless of the honeypot).
  // Durable (Supabase) once migration 011 is applied, else the in-memory fallback.
  const ip = clientIp(req);
  const rl = await takeRateLimit(`submit:${ip}`, RATE_LIMIT, Math.floor(RATE_WINDOW_MS / 1000));
  if (rl.durable ? !rl.allowed : rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Please wait a moment before sending another message.' },
      { status: 429 },
    );
  }

  // Honeypot: a bot filled the hidden field. Pretend success, send nothing.
  if (String(data.botField || '').trim()) {
    return NextResponse.json({ ok: true });
  }

  const formName = String(data.formName || 'waitlist') === 'faithflow' ? 'faithflow' : 'waitlist';
  const name = String(data.name || '').trim().slice(0, 100);
  const email = String(data.email || '').trim().slice(0, 254);
  const interest = String(data.interest || '').trim().slice(0, 80);
  const message = String(data.message || '').trim().slice(0, 2000);

  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'A name and a valid email are required.' },
      { status: 400 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    // Note: do NOT log name/email here (PII in function logs). formName is enough.
    console.warn('RESEND_API_KEY not set. Submission received, no email sent.', { formName });
    // Do not lose the user: report success so they are not stuck, and the
    // warning above shows in the function logs so we know to set the key.
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = name.split(/\s+/)[0] || 'friend';

  // 1) Notification to the Christ Fields inbox. This is the one that must land.
  try {
    await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      replyTo: email,
      subject: `New ${formName === 'faithflow' ? 'FaithFlow' : 'waitlist'} submission from ${name}`,
      html: notificationHtml({ formName, name, email, interest, message }),
      text: `New ${formName} submission\n\nName: ${name}\nEmail: ${email}\nInterest: ${interest || '(none)'}\n\nMessage:\n${message || '(none)'}`,
    });
  } catch (err) {
    console.error('Notification email failed', err);
    return NextResponse.json(
      { ok: false, error: 'Could not send right now. Please try again.' },
      { status: 502 },
    );
  }

  // 2) Branded thank-you to the person. Best effort: do not fail the request if
  // this one has trouble, since the team has already been notified.
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject:
        formName === 'faithflow'
          ? 'Thank you for reaching out to FaithFlow'
          : 'Welcome to Christ Fields',
      html: autoReplyHtml({ firstName, formName }),
      text: autoReplyText({ firstName, formName }),
    });
  } catch (err) {
    console.error('Auto-reply email failed (notification already sent)', err);
  }

  return NextResponse.json({ ok: true });
}
