import { createHmac } from 'node:crypto';
import { boundedText, BodyTooLarge } from '@/lib/security/body';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  normalizePublicSubmissionFormName,
  notificationHtml,
  publicSubmissionLabel,
} from '@/lib/emails';
import { isBodyTooLarge, isCrossSite } from '@/lib/security/origin';
import { takeRateLimit } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';
import { contactMailbox, reserveContactMail } from '@/lib/security/contact-mail';

/** Public contact submissions with bounded processing and shared abuse budgets. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM = process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>';
const NOTIFY = process.env.NOTIFY_EMAIL || 'proverbs@christfields2717.com';
const REPLY_TO = process.env.REPLY_TO_EMAIL || 'proverbs@christfields2717.com';

/**
 * Durable record, best effort: returns the new row's id, or null if the write
 * failed. Degrades gracefully (like lib/rate-limit) until migration 012 is
 * applied. Rows insert with emailed=false; the caller marks emailed after the
 * notification actually lands, so the flag never lies.
 */
async function storeSubmission(row: {
  form_name: string;
  name: string;
  email: string;
  interest: string | null;
  message: string | null;
}): Promise<string | null> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('public_submissions')
      .insert(row)
      .select('id')
      .single();
    if (error || !data?.id) {
      // No PII in logs; the error code is enough to spot a missing table.
      console.warn('Submission not stored (run migration 012?)', { code: error?.code });
      return null;
    }
    return data.id as string;
  } catch {
    return null;
  }
}

/** Best-effort: flag a stored row as notified once the email actually sent. */
async function markEmailed(id: string): Promise<void> {
  try {
    const sb = getSupabase();
    await sb.from('public_submissions').update({ emailed: true }).eq('id', id);
  } catch {
    // The row simply keeps emailed=false, which is the honest state.
  }
}

export async function POST(req: Request) {
  // CSRF defense-in-depth: reject forged cross-site POSTs from other origins.
  const origin=req.headers.get('origin');
  const expected=process.env.NODE_ENV==='development'?new URL(req.url).origin:'https://christfields2717.com';
  if (isCrossSite(req) || (origin && origin!==expected)) {
    return NextResponse.json({ ok: false, error: 'Cross-site requests are not allowed.' }, { status: 403 });
  }
  // Coarse body-size guard before parsing (fields are length-capped below).
  if (isBodyTooLarge(req, 16_000)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }

  if(req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json') return NextResponse.json({ok:false,error:'JSON required.'},{status:415});
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret)return NextResponse.json({ok:false,error:'Please try again later.'},{status:503});
  const ip=req.headers.get('x-nf-client-connection-ip')||'unknown';
  const ipKey=createHmac('sha256',secret).update(new Date().toISOString().slice(0,10)+':'+ip).digest('hex');
  const rate=await takeRateLimit('submit:ip:'+ipKey,5,600);
  if(!rate.durable||!rate.allowed)return NextResponse.json({ok:false,error:'Please wait before trying again.'},{status:rate.durable?429:503});
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(await boundedText(req.body,16000));
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid or oversized body' }, { status: error instanceof BodyTooLarge?413:400 });
  }

  // Reject non-object bodies (arrays, primitives) before coercing fields.
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  // Honeypot: a bot filled the hidden field. Pretend success, send nothing.
  if (String(data.botField || '').trim()) {
    return NextResponse.json({ ok: true });
  }

  if(['name','email','interest','message'].some(k=>data[k]!==undefined&&typeof data[k]!=='string'))return NextResponse.json({ok:false,error:'Invalid fields.'},{status:400});
  const formName = normalizePublicSubmissionFormName(data.formName);
  const name = String(data.name || '').trim().slice(0, 100);
  const email = contactMailbox(data.email);
  const interest = String(data.interest || '').trim().slice(0, 80);
  const message = String(data.message || '').trim().slice(0, 2000);

  if (!name || /[\r\n\x00]/.test(name) || !email) {
    return NextResponse.json(
      { ok: false, error: 'A name and a valid email are required.' },
      { status: 400 },
    );
  }

  const global=await takeRateLimit('submit:global',100,3600);
  if(!global.durable||!global.allowed)return NextResponse.json({ok:false,error:'Please try again later.'},{status:global.durable?429:503});
  const canEmail = Boolean(process.env.RESEND_API_KEY);
  const formLabel = publicSubmissionLabel(formName);

  // Durable record first. Email is the notification of this row, not the
  // record itself.
  const storedId = await storeSubmission({
    form_name: formName,
    name,
    email,
    interest: interest || null,
    message: message || null,
  });
  const stored = storedId !== null;

  if (!canEmail) {
    // Note: do NOT log name/email here (PII in function logs). formName is enough.
    console.warn('RESEND_API_KEY not set. No email sent.', { formName, stored });
    if (stored) {
      // The message is safely recorded; the person is not stuck and not lost.
      return NextResponse.json({ ok: true });
    }
    // Nothing durable happened: a fake success here would silently discard
    // someone who trusted "we read every message." Be honest instead.
    return NextResponse.json(
      { ok: false, error: 'Could not send right now. Please try again.' },
      { status: 502 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  if(!await reserveContactMail()) {
    return NextResponse.json(stored?{ok:true}:{ok:false,error:'Could not send right now. Please try again.'},{status:stored?200:503});
  }
  // 1) Notification to the Christ Fields inbox. This is the one that must land.
  // Resend v6 never rejects: emails.send() resolves with { data, error } even
  // for API and network failures, so the error must be checked, not caught.
  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: NOTIFY,
    replyTo: email,
    subject: `New ${formLabel} from ${name}`,
    html: notificationHtml({ formName, name, email, interest, message }),
    text: `New ${formLabel}\n\nName: ${name}\nEmail: ${email}\nInterest: ${interest || '(none)'}\n\nMessage:\n${message || '(none)'}`,
  });
  if (sendError) {
    // name/statusCode only: Resend validation messages can echo addresses,
    // which would put PII in function logs.
    console.error('Notification email failed', {
      name: sendError.name,
      stored,
    });
    if (!stored) {
      return NextResponse.json(
        { ok: false, error: 'Could not send right now. Please try again.' },
        { status: 502 },
      );
    }
    // The row is stored; asking the person to retry would only duplicate it.
    // The error above flags the failed notification in the function logs, and
    // the row keeps emailed=false so it is findable.
  } else if (storedId) {
    await markEmailed(storedId);
  }

  // Never echo attacker-controlled content to an unverified mailbox.
  const recipientKey=createHmac('sha256',secret).update(email.toLowerCase()).digest('hex');
  const recipient=await takeRateLimit('submit:recipient:'+recipientKey,1,86400);
  if(recipient.durable&&recipient.allowed&&await reserveContactMail()){
    try{await resend.emails.send({from:FROM,to:email,replyTo:REPLY_TO,subject:'Christ Fields contact request received',text:'Someone used this email address on a Christ Fields contact form. If that was you, your message has been received. If it was not you, you can ignore this email. This does not verify your identity, confirm membership, or subscribe you to updates.'});}catch{/* the primary submission remains saved */}
  }

  return NextResponse.json({ ok: true });
}
