'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getSupabase, type QuietReflectionRow } from '@/lib/supabase';
import { getMyMemberships, getGroupMembers } from '@/lib/groups/membership';
import { encryptText, decryptText, isEncryptionConfigured } from '@/lib/security/crypto';
import { matchThemes, isThemeKey, THEMES } from '@/lib/dashboard/themes';
import { questionForWeek, questionByKey, weekKey, type QuietQuestion } from '@/lib/dashboard/questions';
import { verseForTheme, type Verse } from '@/lib/dashboard/verses';
import { dayKeyInZone } from '@/lib/dashboard/timezone';
import { dateInWords } from '@/lib/dashboard/format';
import { getMemberTimeZone } from '@/lib/dashboard/timezone-server';
import { ensureMemberPrefs, appUrl } from '@/lib/dashboard/prefs';
import { claimMany, markMany, releaseClaims } from '@/lib/notify/deliveries';
import { sendOne, isEmailConfigured } from '@/lib/notify/email';
import { safetyLeaderMail, safetyRevealMail } from '@/lib/notify/templates';

/**
 * The quiet question. A member writes in private; the words are encrypted at
 * rest and only ever decrypted for the author. What can leave the entry is a
 * theme word the member confirmed, and only as part of a group picture (see
 * lib/dashboard/quiet-themes.ts). Crisis patterns take a different path: a
 * care card for the member and one private email to the leaders, with no
 * words, no theme, and no name unless the member chooses to give it.
 */

const BODY_MAX = 2_000;
const FOUNDER_EMAIL = process.env.NOTIFY_EMAIL || 'proverbs@christfields2717.com';

export interface ReflectionView {
  id: string;
  createdAt: string;
  /** "Thu, Sep 4" in the member's own zone, formatted here so the browser never disagrees. */
  dateText: string;
  question: string;
  text: string;
  themes: string[];
  confirmed: boolean;
  safety: boolean;
}

export interface QuietView {
  question: QuietQuestion;
  weekKey: string;
  answeredThisWeek: boolean;
  shareThemes: boolean;
  recent: ReflectionView[];
  /** All the theme words a member can pick from when we guessed wrong. */
  themeChoices: { key: string; label: string }[];
  ready: boolean;
}

async function memberZone(): Promise<string> {
  const tz = await getMemberTimeZone();
  return tz && tz !== 'UTC' ? tz : 'America/Denver';
}

async function zoneDayKey(): Promise<string> {
  return dayKeyInZone(await memberZone());
}

export async function getQuiet(): Promise<QuietView> {
  const dayKey = await zoneDayKey();
  const question = questionForWeek(dayKey);
  const wk = weekKey(dayKey);
  const empty: QuietView = {
    question,
    weekKey: wk,
    answeredThisWeek: false,
    shareThemes: true,
    recent: [],
    themeChoices: [],
    ready: isEncryptionConfigured(),
  };
  try {
    const { userId } = await auth();
    if (!userId) return empty;
    const sb = getSupabase();
    const [prefs, rowsRes] = await Promise.all([
      ensureMemberPrefs(userId),
      sb
        .from('quiet_reflections')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12),
    ]);
    const rows = (rowsRes.data as QuietReflectionRow[] | null) ?? [];
    const weekStart = Date.now() - 7 * 86_400_000;
    const zone = await memberZone();
    const recent: ReflectionView[] = rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      dateText: dateInWords(r.created_at, zone),
      question: questionByKey(r.question_key)?.text ?? '',
      text: decryptText(r.body_enc) ?? '',
      themes: r.themes,
      confirmed: r.confirmed,
      safety: r.safety,
    }));
    return {
      question,
      weekKey: wk,
      answeredThisWeek: rows.some((r) => r.question_key === question.key && Date.parse(r.created_at) > weekStart),
      shareThemes: prefs.share_themes ?? true,
      recent,
      themeChoices: THEMES.map((t) => ({ key: t.key, label: t.label })),
      ready: isEncryptionConfigured(),
    };
  } catch (err) {
    console.error('getQuiet failed', err);
    return empty;
  }
}

export interface SaveResult {
  ok: boolean;
  id?: string;
  themes: string[];
  safety: boolean;
  /** For a safety entry: whether at least one leader email actually went out. */
  notified: boolean;
  verse: Verse | null;
  error?: string;
}

function verseFor(themes: string[], dayKey: string): Verse | null {
  return themes.length ? verseForTheme(themes[0], dayKey) : null;
}

export async function saveReflection(questionKey: string, body: string): Promise<SaveResult> {
  const none: SaveResult = { ok: false, themes: [], safety: false, notified: false, verse: null };
  try {
    const { userId } = await auth();
    if (!userId) return { ...none, error: 'Not signed in.' };
    if (!isEncryptionConfigured()) return { ...none, error: 'This is not switched on yet.' };
    const text = (body || '').trim().slice(0, BODY_MAX);
    if (text.length < 2) return { ...none, error: 'Write a few words first.' };
    const q = questionByKey(questionKey) ?? questionForWeek(await zoneDayKey());
    const match = matchThemes(text);
    const sb = getSupabase();
    const { data, error } = await sb
      .from('quiet_reflections')
      .insert({
        clerk_user_id: userId,
        question_key: q.key,
        body_enc: encryptText(text),
        themes: match.themes,
        confirmed: false,
        safety: match.safety,
      })
      .select('id')
      .single();
    if (error || !data) {
      console.error('saveReflection insert failed', error);
      return { ...none, error: 'Could not keep that. Try once more.' };
    }
    const id = (data as { id: string }).id;
    let notified = false;
    if (match.safety) {
      notified = await notifyLeadersOfSafety(userId).catch((err) => {
        console.error('safety notice failed', err);
        return false;
      });
    }
    revalidatePath('/dashboard/quiet');
    revalidatePath('/dashboard');
    return { ok: true, id, themes: match.themes, safety: match.safety, notified, verse: verseFor(match.themes, await zoneDayKey()) };
  } catch (err) {
    console.error('saveReflection failed', err);
    return { ...none, error: 'Something went wrong.' };
  }
}

/** The member confirms or corrects what we heard. At most two theme words. */
export async function confirmReflectionThemes(id: string, themes: string[]): Promise<{ ok: boolean; verse: Verse | null }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, verse: null };
    const clean = Array.from(new Set(themes.filter(isThemeKey))).slice(0, 2);
    const sb = getSupabase();
    const { error } = await sb
      .from('quiet_reflections')
      .update({ themes: clean, confirmed: true })
      .eq('id', id)
      .eq('clerk_user_id', userId);
    if (error) return { ok: false, verse: null };
    revalidatePath('/dashboard/quiet');
    return { ok: true, verse: verseFor(clean, await zoneDayKey()) };
  } catch {
    return { ok: false, verse: null };
  }
}

export async function deleteReflection(id: string): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const sb = getSupabase();
    const { error } = await sb.from('quiet_reflections').delete().eq('id', id).eq('clerk_user_id', userId);
    revalidatePath('/dashboard/quiet');
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function setShareThemes(on: boolean): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    await ensureMemberPrefs(userId);
    const sb = getSupabase();
    const { error } = await sb
      .from('member_prefs')
      .update({ share_themes: !!on, updated_at: new Date().toISOString() })
      .eq('clerk_user_id', userId);
    revalidatePath('/dashboard/quiet');
    revalidatePath('/dashboard/settings');
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/* ------------------------------------------------------------ safety */

interface LeaderTarget {
  id: string;
  email: string;
  firstName: string;
  groupName: string;
}

/**
 * Leaders of every group this member is in, plus the founder. Never the
 * member, and never the same inbox twice (a founder who also leads a group
 * gets one copy; a founder writing a reflection is not emailed about it).
 */
async function leadersFor(userId: string, memberEmail: string): Promise<LeaderTarget[]> {
  const memberships = await getMyMemberships();
  const out: LeaderTarget[] = [];
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>([memberEmail.toLowerCase()].filter(Boolean));
  for (const m of memberships) {
    for (const p of await getGroupMembers(m.orgId)) {
      const email = p.email.toLowerCase();
      if (!p.isLeader || p.userId === userId || seenIds.has(p.userId) || !email.includes('@') || seenEmails.has(email)) continue;
      seenIds.add(p.userId);
      seenEmails.add(email);
      out.push({ id: p.userId, email: p.email, firstName: p.firstName, groupName: m.orgName });
    }
  }
  const founder = FOUNDER_EMAIL.toLowerCase();
  if (founder.includes('@') && !seenEmails.has(founder)) {
    out.push({ id: 'founder', email: FOUNDER_EMAIL, firstName: 'Lisandro', groupName: memberships[0]?.orgName ?? 'Christ Fields' });
  }
  return out;
}

async function memberEmailOf(): Promise<string> {
  const u = await currentUser().catch(() => null);
  return u?.primaryEmailAddress?.emailAddress ?? u?.emailAddresses?.[0]?.emailAddress ?? '';
}

/**
 * Send one email to each target under a dedupe key. Safety mail sits OUTSIDE
 * the shared daily budget (Resend's hard cap leaves headroom above our 80 for
 * exactly this), and a failed send gives its claim back so the next save can
 * try again. Returns how many went out now.
 */
async function sendToLeaders(key: string, targets: LeaderTarget[], build: (t: LeaderTarget) => ReturnType<typeof safetyLeaderMail>): Promise<number> {
  const sb = getSupabase();
  const claimed = await claimMany(sb, key, targets.map((t) => t.id), 'email');
  let sent = 0;
  for (const t of targets) {
    if (!claimed.has(t.id)) continue;
    const res = await sendOne({ ...build(t), to: t.email }, `${key}:${t.id}`);
    if (res.ok) {
      await markMany(sb, key, [t.id], 'email', 'sent');
      sent += 1;
    } else {
      console.error('safety email failed', res.error);
      await releaseClaims(sb, key, [t.id], 'email');
    }
  }
  return sent;
}

/**
 * One private email per leader per member-week. No words, no theme, no name.
 * Returns true when a leader has been reached this week (now or earlier).
 */
async function notifyLeadersOfSafety(userId: string): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const targets = await leadersFor(userId, await memberEmailOf());
  if (targets.length === 0) return false;
  const key = `${userId}:safety:${weekKey(await zoneDayKey())}`;
  const sent = await sendToLeaders(key, targets, (t) =>
    safetyLeaderMail({ leaderFirstName: t.firstName, groupName: t.groupName, openUrl: `${appUrl()}/dashboard/lead` }),
  );
  if (sent > 0) return true;
  // Nothing new went out: was a leader already told this week (an earlier entry)?
  const { count } = await getSupabase()
    .from('notification_deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('dedupe_key', key)
    .eq('status', 'sent');
  return (count ?? 0) > 0;
}

/** The member chooses to be known. First name only, once per entry; a failed send can be retried. */
export async function revealToLeaders(id: string): Promise<{ ok: boolean; sent: number }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, sent: 0 };
    const sb = getSupabase();
    const { data } = await sb.from('quiet_reflections').select('id, safety').eq('id', id).eq('clerk_user_id', userId).maybeSingle();
    const row = data as { id: string; safety: boolean } | null;
    if (!row || !row.safety) return { ok: false, sent: 0 };
    if (!isEmailConfigured()) return { ok: false, sent: 0 };
    const user = await currentUser();
    const firstName = user?.firstName || user?.username || 'A member';
    const targets = await leadersFor(userId, user?.primaryEmailAddress?.emailAddress ?? '');
    const key = `${id}:safety_reveal`;
    const sent = await sendToLeaders(key, targets, (t) =>
      safetyRevealMail({ leaderFirstName: t.firstName, memberFirstName: firstName, groupName: t.groupName }),
    );
    if (sent > 0) return { ok: true, sent };
    const { count } = await sb.from('notification_deliveries').select('id', { count: 'exact', head: true }).eq('dedupe_key', key).eq('status', 'sent');
    return { ok: (count ?? 0) > 0, sent: 0 };
  } catch (err) {
    console.error('revealToLeaders failed', err);
    return { ok: false, sent: 0 };
  }
}
