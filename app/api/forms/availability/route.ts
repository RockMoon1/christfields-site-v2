import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'node:crypto';
import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';
import { POLL_SLUG, validateAnswer } from '@/lib/forms/availability';
import { getPublicForm, formOpen } from '@/lib/forms/server';
import { datesFor, localDate, SLUG_RE, validateContact } from '@/lib/forms/events';
import { requestReceipt } from '@/lib/forms/receipts';
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
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return reply(400, { error: 'Invalid response.' });
    const input = raw as Record<string, unknown>;
    const slug = input.formSlug ?? POLL_SLUG;
    if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return reply(400, { error: 'Invalid form.' });
    const form = await getPublicForm(slug);
    if (!form) return reply(503, { error: 'This form is unavailable.' });
    const answer = validateAnswer(raw, datesFor(form.settings, '0000-00-00'));
    const extra = validateContact(input, form.settings);
    if (!answer || !extra) return reply(400, { error: 'Check your contact details, dates, and privacy confirmations.' });
    const legacy = !input.formSlug && !['email','phone','followUp','priorAttendance','receiptRequested'].some(key => key in input);
    const hash = createHash('sha256').update(JSON.stringify(legacy ? answer : {answer,extra,slug})).digest('hex');
    const sb = getSupabase();
    const stale = [...answer.available,...answer.unavailable].some(d => d < localDate(form.settings.tz));
    if (legacy || stale || !formOpen(form)) {
      // Allow an exact saved retry without charging global quota or sending mail.
      const previous = await sb.from('activity_responses').select('id').eq('id',answer.submissionId).eq('form_slug',slug).eq('payload_hash',hash).maybeSingle();
      if (previous.error) return reply(503,{error:'Could not check this response. Please retry later.'});
      if (previous.data) return reply(200,{ok:true,saved:true,emailed:false});
      if (legacy) return reply(400,{error:'This form and its privacy notice have been updated. Refresh the page before submitting.'});
      return reply(stale ? 400 : 410,{error:stale?'A selected date has passed. Refresh the page and choose current dates.':'This poll is closed. Please contact the organizer.'});
    }
    // Only validated answers from IPs still within their own limit may spend
    // the shared storage/email budget. Malformed bodies and honeypots cannot.
    const globalLimit = await takeRateLimit('forms:global', 100, 3600);
    if (!globalLimit.durable) return reply(503, { error: 'The form is temporarily unavailable. Please try later.' });
    if (!globalLimit.allowed) return reply(429, { error: 'Too many attempts. Please try again later.' });
    // A database row lock makes closing the form and accepting a response atomic.
    const { data, error } = await sb.rpc('submit_activity_response_v2', {
      p_slug: slug, p_id: answer.submissionId, p_hash: hash, p_name: answer.name,
      p_interest: answer.interest, p_available: answer.available, p_unavailable: answer.unavailable,
      p_notes: answer.notes, p_notice: '2026-11-04-v2', p_extra: extra,
    });
    if (error) return reply(503, { error: 'We could not save your response. Please retry with the same form.' });
    if (data === 'closed') return reply(410, { error: 'This poll is closed. Please contact the organizer.' });
    if (data === 'conflict') return reply(409, { error: 'This response was already submitted. Contact the organizer to change it.' });
    if (data === 'invalid') return reply(400, { error: 'Dates or event settings changed. Refresh the page and choose current dates.' });
    if (data !== 'created' && data !== 'duplicate') return reply(503, { error: 'We could not confirm your response. Please retry.' });
    let emailed = false;
    // Only the first durable insert sends mail. A lost HTTP response never duplicates it.
    if (data === 'created' && process.env.RESEND_API_KEY) {
      try {
        const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>',
          to: 'proverbs@christfields2717.com',
          subject: 'Iron and Ember: activity response',
          text: `Event: ${form.settings.title}\nName: ${answer.name}\nInterest: ${answer.interest}\nAvailable: ${answer.available.join(', ') || 'Not specified'}\nUnavailable: ${answer.unavailable.join(', ') || 'Not specified'}\n\nScheduling notes: ${answer.notes || 'None'}\n\nContact details, if provided, remain in the private organizer dashboard: https://christfields2717.com/dashboard/forms\nResponse reference: ${answer.submissionId}`,
        }, { idempotencyKey: `activity/${answer.submissionId}` });
        emailed = !result.error;
        await sb.from('activity_responses').update({ email_status: emailed ? 'sent' : 'failed' }).eq('id', answer.submissionId).eq('form_slug', slug);
      } catch { /* The saved response remains available in the private dashboard. */ }
    }
    if (data === 'created' && extra.receiptRequested) await requestReceipt(answer.submissionId, extra.email);
    return reply(200, { ok: true, saved: true, emailed });
  } catch { return reply(503, { error: 'The form is temporarily unavailable. Please retry with the same form.' }); }
}
