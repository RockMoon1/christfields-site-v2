'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { feedbackNotificationHtml } from '@/lib/emails';

/**
 * In-app feedback. A signed-in member sends a short note about what they would
 * like added or changed, and it is emailed to the Christ Fields inbox so
 * Lisandro sees every suggestion. No database table needed: feedback is
 * low-volume and email is the place it is actually acted on.
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

    if (rateLimited(userId)) {
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

    if (!process.env.RESEND_API_KEY) {
      // Do not lose the member: log it and report success so they are not stuck.
      console.warn('Feedback received but RESEND_API_KEY is not set', { category, fromEmail, message });
      return { ok: true };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      replyTo: fromEmail || undefined,
      subject: `Dashboard feedback: ${category}`,
      html: feedbackNotificationHtml({ category, message, fromName, fromEmail }),
      text: `Member feedback (${category})\n\nFrom: ${fromName} ${fromEmail ? `<${fromEmail}>` : ''}\n\n${message}`,
    });

    return { ok: true };
  } catch (err) {
    console.error('submitFeedback failed', err);
    return { ok: false, error: 'Could not send right now. Please try again.' };
  }
}
