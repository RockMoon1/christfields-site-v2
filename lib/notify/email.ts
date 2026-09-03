import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';
import { EMAIL_BUCKET, EMAIL_WINDOW_SECONDS, TIER_LIMITS, emailWindowStartIso, type EmailTier } from './rules';

/**
 * Transactional email with a shared, tiered daily budget.
 *
 * One Resend account serves this app and the public forms, and the free tier
 * stops at 100 a day. So the app keeps to 80, and the 80 is not first-come:
 * cancellations may use all of it, reminders stop at 65, and "new post" mail
 * stops at 50. The counter is the durable `rate_limit_take` bucket; a fan-out
 * PEEKS the window first and only actual sends take a slot, so skipped
 * recipients never inflate the count.
 *
 * Fail closed: if the counter RPC is missing, nothing but urgent mail goes out.
 */

const FROM = process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>';
const REPLY_TO = process.env.REPLY_TO_EMAIL || 'proverbs@christfields2717.com';

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Stable per (thing, recipient) so a retried run cannot double-send. */
  idempotencyKey: string;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface EmailBudget {
  available: number;
  durable: boolean;
}

/** How many more emails this tier may send in the current UTC day. */
export async function peekEmailBudget(tier: EmailTier, nowMs: number = Date.now()): Promise<EmailBudget> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('rate_limit_counters')
      .select('count')
      .eq('bucket', EMAIL_BUCKET)
      .eq('window_start', emailWindowStartIso(nowMs))
      .maybeSingle();
    if (error) {
      // Counter table missing: only urgent mail may go, and only up to its cap.
      return { available: tier === 'urgent' ? TIER_LIMITS.urgent : 0, durable: false };
    }
    const used = (data as { count: number } | null)?.count ?? 0;
    return { available: Math.max(0, TIER_LIMITS[tier] - used), durable: true };
  } catch {
    return { available: tier === 'urgent' ? TIER_LIMITS.urgent : 0, durable: false };
  }
}

/** Take one slot for a tier. False means over budget (or not durable for a non-urgent tier). */
export async function takeEmailSlot(tier: EmailTier): Promise<boolean> {
  const r = await takeRateLimit(EMAIL_BUCKET, TIER_LIMITS[tier], EMAIL_WINDOW_SECONDS);
  if (!r.durable) return tier === 'urgent';
  return r.allowed;
}

let client: Resend | null = null;
function resend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendOne(mail: OutgoingEmail): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isEmailConfigured()) return { ok: false, error: 'RESEND_API_KEY missing' };
  try {
    const { data, error } = await resend().emails.send(
      {
        from: FROM,
        to: mail.to,
        replyTo: REPLY_TO,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      },
      { idempotencyKey: mail.idempotencyKey.slice(0, 256) },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'send failed' };
  }
}
