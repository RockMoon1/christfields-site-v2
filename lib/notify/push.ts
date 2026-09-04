import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushSubscriptionRow } from '@/lib/supabase';

/**
 * Web Push over VAPID. Free at any scale; the only cost is honesty about
 * delivery, which is why liveness lives in the device ack (/api/push/ack),
 * not here. This module only sends, deletes dead endpoints (404/410), and
 * counts failures.
 *
 * Sends run ten at a time with a socket timeout, so one slow or hostile
 * endpoint can neither stall a leader's action nor eat the tick's budget.
 */

export interface PushMessage {
  title: string;
  body: string;
  /** Where a tap lands. Relative to the app origin. */
  url: string;
  /** Same tag replaces an earlier notification for the same event. */
  tag: string;
}

export interface PushOptions {
  urgency: 'high' | 'normal' | 'low';
  ttlSeconds: number;
}

const CONCURRENCY = 10;
const SOCKET_TIMEOUT_MS = 5_000;

let configured: boolean | null = null;

export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:proverbs@christfields2717.com';
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
  } catch (err) {
    console.error('VAPID keys rejected', err);
    configured = false;
  }
  return configured;
}

export interface SubOutcome {
  subId: string;
  userId: string;
  ok: boolean;
}

export interface PushOutcome {
  outcomes: SubOutcome[];
  sent: number;
  failed: number;
  removed: number;
}

function statusOf(err: unknown): number {
  const e = err as { statusCode?: number; status?: number } | null;
  return e?.statusCode ?? e?.status ?? 0;
}

/** Send one message to a set of subscriptions (any members). Never throws. */
export async function pushToSubs(
  sb: SupabaseClient,
  subs: PushSubscriptionRow[],
  message: PushMessage,
  opts: PushOptions,
): Promise<PushOutcome> {
  const out: PushOutcome = { outcomes: [], sent: 0, failed: 0, removed: 0 };
  if (subs.length === 0 || !isPushConfigured()) return out;

  const payload = JSON.stringify({
    title: message.title.slice(0, 80),
    body: message.body.slice(0, 200),
    url: message.url,
    tag: message.tag,
  });

  const dead: string[] = [];
  const failed: PushSubscriptionRow[] = [];
  for (let i = 0; i < subs.length; i += CONCURRENCY) {
    await Promise.all(
      subs.slice(i, i + CONCURRENCY).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: opts.ttlSeconds, urgency: opts.urgency, timeout: SOCKET_TIMEOUT_MS },
          );
          out.outcomes.push({ subId: s.id, userId: s.clerk_user_id, ok: true });
          out.sent += 1;
        } catch (err) {
          const code = statusOf(err);
          if (code === 404 || code === 410) dead.push(s.id);
          else failed.push(s);
          out.outcomes.push({ subId: s.id, userId: s.clerk_user_id, ok: false });
        }
      }),
    );
  }

  if (dead.length > 0) {
    await sb.from('push_subscriptions').delete().in('id', dead);
    out.removed = dead.length;
  }
  if (failed.length > 0) {
    // One UPDATE per distinct current count instead of one per row.
    const byCount = new Map<number, string[]>();
    for (const s of failed) {
      const list = byCount.get(s.fail_count) ?? [];
      list.push(s.id);
      byCount.set(s.fail_count, list);
    }
    for (const [n, ids] of byCount) {
      await sb.from('push_subscriptions').update({ fail_count: n + 1 }).in('id', ids);
    }
    out.failed = failed.length;
  }
  return out;
}
