'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { feedbackNotificationHtml } from '@/lib/emails';
import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';

/**
 * In-app feedback. A signed-in member sends a short note about what they would
 * like added or changed. Like the public form route, the note is stored first
 * (public_submissions, form_name 'feedback') so a missing or failing email key
 * can never silently lose it, then emailed to the Christ Fields inbox where it
 * is actually acted on. Resend v6 never rejects: emails.send() resolves with
 * { error }, so the error is checked, not caught.
 *
 * Env (shared with the public form route):
 *   RESEND_API_KEY  required to actually send
 *   FROM_EMAIL      defaults to "Christ Fields <proverbs@christfields2717.com>"
 *   NOTIFY_EMAIL    where feedback lands. Defaults to proverbs@christfields2717.com
 */

const FROM = process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>';
const NOTIFY = process.env.NOTIFY_EMAIL || 'proverbs@christfields2717.com';

const CATEGORIES = ['Idea', 'Something is confusing', 'Bug', 'Encouragement', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];

// Best-effort in-memory rate limit (per warm instance): 5 notes / 10 min / user.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(userId, recent);
    return true;
  }
  recent.push(now);
  hits.set(userId, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

/** Durable record, best effort; degrades gracefully until migration 012 runs. */
async function storeFeedback(row: {
  name: string;
  email: string;
  interest: string;
  message: string;
}): Promise<string | null> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('public_submissions')
      .insert({ form_name: 'feedback', ...row })
      .select('id')
      .single();
    if (error || !data?.id) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

async function markEmailed(id: string): Promise<void> {
  try {
    const sb = getSupabase();
    await sb.from('public_submissions').update({ emailed: true }).eq('id', id);
  } catch {
    // The row simply keeps emailed=false, which is the honest state.
  }
}

export async function submitFeedback(input: {
  category: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: 'Please sign in first.' };

    const message = String(input.message || '').trim().slice(0, 2000);
    if (message.length < 3) return { ok: false, error: 'Add a little more detail first.' };

    const category: Category = (CATEGORIES as readonly string[]).includes(input.category)
      ? (input.category as Category)
      : 'Other';

    // Durable limit when migration 011 has been run, else the in-memory one
    // (which resets per serverless instance), same pattern as /api/submit.
    const rl = await takeRateLimit(
      `feedback:${userId}`,
      RATE_LIMIT,
      Math.floor(RATE_WINDOW_MS / 1000),
    );
    if (rl.durable ? !rl.allowed : rateLimited(userId)) {
      return { ok: false, error: 'Thanks. Give it a few minutes before sending more.' };
    }

    // Identify the sender so Lisandro can reply, but never block on it.
    let fromName = 'A member';
    let fromEmail = '';
    try {
      const user = await currentUser();
      fromName =
        user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || 'A member';
      fromEmail = user?.primaryEmailAddress?.emailAddress ?? '';
    } catch {
      // identity is a nice-to-have; the feedback itself still goes through
    }

    // Durable record first; email is the notification of it.
    const storedId = await storeFeedback({
      name: fromName,
      email: fromEmail,
      interest: category,
      message,
    });
    const stored = storedId !== null;

    if (!process.env.RESEND_API_KEY) {
      // No PII in logs: category and outcome are enough to spot the misconfig.
      console.warn('Feedback received but RESEND_API_KEY is not set', { category, stored });
      if (stored) return { ok: true };
      return { ok: false, error: 'Could not send right now. Please try again.' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      replyTo: fromEmail || undefined,
      subject: `Dashboard feedback: ${category}`,
      html: feedbackNotificationHtml({ category, message, fromName, fromEmail }),
      text: `Member feedback (${category})\n\nFrom: ${fromName} ${fromEmail ? `<${fromEmail}>` : ''}\n\n${message}`,
    });
    if (sendError) {
      // name only: Resend messages can echo addresses (PII) into logs.
      console.error('Feedback email failed', { name: sendError.name, stored });
      if (!stored) return { ok: false, error: 'Could not send right now. Please try again.' };
      // Stored safely; a retry would only duplicate the note.
    } else if (storedId) {
      await markEmailed(storedId);
    }

    return { ok: true };
  } catch (err) {
    console.error('submitFeedback failed', err);
    return { ok: false, error: 'Could not send right now. Please try again.' };
  }
}
