import { orgsForUser, getGroupMembers, type GroupMember } from '@/lib/groups/membership';
import { loadPeopleContext, runPush } from './fanout';
import { dedupeKey } from './rules';

/**
 * The prayer wall's two automations: one push when someone asks for prayer,
 * one when they say it was answered. To everyone in the poster's groups except
 * the poster, phone only (no email), quiet hours respected, inside the daily
 * ceiling. Never throws to the caller: a prayer post must never fail because
 * a notification did.
 */

export interface PrayerNotice {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
}

export async function notifyPrayer(kind: 'posted' | 'answered', prayer: PrayerNotice): Promise<number> {
  try {
    const orgs = await orgsForUser(prayer.authorId);
    if (orgs.length === 0) return 0;
    const seen = new Set<string>();
    const recipients: GroupMember[] = [];
    for (const o of orgs.slice(0, 5)) {
      for (const m of await getGroupMembers(o.orgId)) {
        if (m.userId === prayer.authorId || seen.has(m.userId)) continue;
        seen.add(m.userId);
        recipients.push(m);
      }
    }
    if (recipients.length === 0) return 0;
    const ctx = await loadPeopleContext(recipients.map((m) => m.userId));
    const first = prayer.authorName || 'Someone';
    const title = prayer.title.length > 60 ? `${prayer.title.slice(0, 57)}...` : prayer.title;
    const res = await runPush(ctx, {
      key: dedupeKey(prayer.id, kind === 'posted' ? 'prayer_posted' : 'prayer_answered'),
      recipients,
      message: () =>
        kind === 'posted'
          ? { title: `${first} asked for prayer`, body: title, url: '/dashboard/community', tag: `prayer-${prayer.id}` }
          : { title: `${first}'s prayer was answered`, body: title, url: '/dashboard/community', tag: `prayer-${prayer.id}` },
      urgency: 'normal',
      ttlSeconds: 12 * 3600,
      loud: false,
      ceiling: true,
      retryable: false,
    });
    return res.pushed;
  } catch (err) {
    console.error('notifyPrayer failed', err);
    return 0;
  }
}
