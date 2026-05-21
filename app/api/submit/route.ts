import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { autoReplyHtml, autoReplyText, notificationHtml } from '@/lib/emails';

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

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
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
    console.warn('RESEND_API_KEY not set. Submission received, no email sent.', {
      formName,
      name,
      email,
    });
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
