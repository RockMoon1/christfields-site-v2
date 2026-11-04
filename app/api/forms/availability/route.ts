import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'node:crypto';
import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';
import { POLL_SLUG, NOTICE_VERSION, validateAnswer } from '@/lib/forms/availability';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (status: number, body: object) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  // Netlify's adapter may expose an internal function origin in req.url.
  // Compare browser origins to the canonical public site, never forwarded hosts.
  const allowedOrigin = process.env.NODE_ENV === 'development' ? new URL(req.url).origin : 'https://christfields2717.com';
  if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== allowedOrigin)) return reply(403, { error: 'Please use the form on this website.' });
  if (!req.headers.get('content-type')?.startsWith('application/json')) return reply(415, { error: 'JSON required.' });
  if (Number(req.headers.get('content-length')) > 12000) return reply(413, { error: 'Response too large.' });
  try {
    // Fail closed if shared abuse protection is unavailable. No raw IP is stored.
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) return reply(503, { error: 'The form is temporarily unavailable. Please try later.' });
    const ip = req.headers.get('x-nf-client-connection-ip') || 'unknown';
    const bucket = createHmac('sha256', secret).update(`forms:${new Date().toISOString().slice(0, 10)}:${ip}`).digest('hex');
    // Charge every attempt to its IP first. Already-throttled callers must not
    // spend the shared allowance or force body parsing on subsequent requests.
    const ipLimit = await takeRateLimit(`forms:ip:${bucket}`, 8, 600);
    if (!ipLimit.durable) return reply(503, { error: 'The form is temporarily unavailable. Please try later.' });
    if (!ipLimit.allowed) return reply(429, { error: 'Too many attempts. Please try again later.' });
    const reader = req.body?.getReader();
    if (!reader) return reply(400, { error: 'Missing response.' });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 12000) { await reader.cancel(); return reply(413, { error: 'Response too large.' }); }
      chunks.push(value);
    }
    let raw: unknown;
    try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(400, { error: 'Invalid response.' }); }
    if (raw && typeof raw === 'object' && 'website' in raw && (raw as {website: unknown}).website) return reply(400, { error: 'Please leave the website field empty.' });
    const answer = validateAnswer(raw);
    if (!answer) return reply(400, { error: 'Check your name, November dates, and privacy confirmations.' });
    // Only validated answers from IPs still within their own limit may spend
    // the shared storage/email budget. Malformed bodies and honeypots cannot.
    const globalLimit = await takeRateLimit('forms:global', 100, 3600);
    if (!globalLimit.durable) return reply(503, { error: 'The form is temporarily unavailable. Please try later.' });
    if (!globalLimit.allowed) return reply(429, { error: 'Too many attempts. Please try again later.' });
    const hash = createHash('sha256').update(JSON.stringify(answer)).digest('hex');
    const sb = getSupabase();
    // A database row lock makes closing the form and accepting a response atomic.
    const { data, error } = await sb.rpc('submit_activity_response', {
      p_slug: POLL_SLUG, p_id: answer.submissionId, p_hash: hash, p_name: answer.name,
      p_interest: answer.interest, p_available: answer.available, p_unavailable: answer.unavailable,
      p_notes: answer.notes, p_notice: NOTICE_VERSION,
    });
    if (error) return reply(503, { error: 'We could not save your response. Please retry with the same form.' });
    if (data === 'closed') return reply(410, { error: 'This poll is closed. Please contact the organizer.' });
    if (data === 'conflict') return reply(409, { error: 'This response was already submitted. Contact the organizer to change it.' });
    if (data !== 'created' && data !== 'duplicate') return reply(503, { error: 'We could not confirm your response. Please retry.' });
    let emailed = false;
    // Only the first durable insert sends mail. A lost HTTP response never duplicates it.
    if (data === 'created' && process.env.RESEND_API_KEY) {
      try {
        const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>',
          to: 'proverbs@christfields2717.com',
          subject: 'Iron and Ember: November availability response',
          text: `Name: ${answer.name}\nInterest: ${answer.interest}\nAvailable: ${answer.available.join(', ') || 'Not specified'}\nUnavailable: ${answer.unavailable.join(', ') || 'Not specified'}\n\nScheduling notes: ${answer.notes || 'None'}\n\nPrivate organizer view: https://christfields2717.com/dashboard/forms\nResponse reference: ${answer.submissionId}`,
        }, { idempotencyKey: `activity/${answer.submissionId}` });
        emailed = !result.error;
        await sb.from('activity_responses').update({ email_status: emailed ? 'sent' : 'failed' }).eq('id', answer.submissionId).eq('form_slug', POLL_SLUG);
      } catch { /* The saved response remains available in the private dashboard. */ }
    }
    return reply(200, { ok: true, saved: true, emailed });
  } catch { return reply(503, { error: 'The form is temporarily unavailable. Please retry with the same form.' }); }
}
