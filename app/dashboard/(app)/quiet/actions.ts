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
import { getMemberTimeZone } from '@/lib/dashboard/timezone-server';
import { ensureMemberPrefs, appUrl } from '@/lib/dashboard/prefs';
import { claimMany, markMany } from '@/lib/notify/deliveries';
import { sendOne, takeEmailSlot, isEmailConfigured } from '@/lib/notify/email';
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

async function zoneDayKey(): Promise<string> {
  const tz = await getMemberTimeZone();
  return dayKeyInZone(tz && tz !== 'UTC' ? tz : 'America/Denver');
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
    const recent: ReflectionView[] = rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
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
  verse: Verse | null;
  error?: string;
}

function verseFor(themes: string[], dayKey: string): Verse | null {
  return themes.length ? verseForTheme(themes[0], dayKey) : null;
}

export async function saveReflection(questionKey: string, body: string): Promise<SaveResult> {
  const none: SaveResult = { ok: false, themes: [], safety: false, verse: null };
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
    if (match.safety) await notifyLeadersOfSafety(userId).catch((err) => console.error('safety notice failed', err));
    revalidatePath('/dashboard/quiet');
    revalidatePath('/dashboard');
    return { ok: true, id, themes: match.themes, safety: match.safety, verse: verseFor(match.themes, await zoneDayKey()) };
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

/** Leaders of every group this member is in, plus the founder. Never the member. */
async function leadersFor(userId: string): Promise<LeaderTarget[]> {
  const memberships = await getMyMemberships();
  const out: LeaderTarget[] = [];
  const seen = new Set<string>();
  for (const m of memberships) {
    for (const p of await getGroupMembers(m.orgId)) {
      if (!p.isLeader || p.userId === userId || seen.has(p.userId) || !p.email.includes('@')) continue;
      seen.add(p.userId);
      out.push({ id: p.userId, email: p.email, firstName: p.firstName, groupName: m.orgName });
    }
  }
  const groupName = memberships[0]?.orgName ?? 'Christ Fields';
  if (!seen.has('founder') && FOUNDER_EMAIL.includes('@')) out.push({ id: 'founder', email: FOUNDER_EMAIL, firstName: 'Lisandro', groupName });
  return out;
}

/** One private email per leader per member-week. No words, no theme, no name. */
async function notifyLeadersOfSafety(userId: string): Promise<void> {
  if (!isEmailConfigured()) return;
  const targets = await leadersFor(userId);
  if (targets.length === 0) return;
  const sb = getSupabase();
  const key = `${userId}:safety:${weekKey(await zoneDayKey())}`;
  const claimed = await claimMany(sb, key, targets.map((t) => t.id), 'email');
  for (const t of targets) {
    if (!claimed.has(t.id)) continue;
    const slot = await takeEmailSlot('urgent');
    if (!slot) {
      await markMany(sb, key, [t.id], 'email', 'skipped_budget');
      continue;
    }
    const mail = safetyLeaderMail({ leaderFirstName: t.firstName, groupName: t.groupName, openUrl: `${appUrl()}/dashboard/lead` });
    const res = await sendOne({ ...mail, to: t.email }, `${key}:${t.id}`);
    await markMany(sb, key, [t.id], 'email', res.ok ? 'sent' : 'failed');
  }
}

/** The member chooses to be known. First name only, once per entry. */
export async function revealToLeaders(id: string): Promise<{ ok: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const sb = getSupabase();
    const { data } = await sb.from('quiet_reflections').select('id, safety').eq('id', id).eq('clerk_user_id', userId).maybeSingle();
    const row = data as { id: string; safety: boolean } | null;
    if (!row || !row.safety) return { ok: false };
    if (!isEmailConfigured()) return { ok: false };
    const [user, targets] = await Promise.all([currentUser(), leadersFor(userId)]);
    const firstName = user?.firstName || user?.username || 'A member';
    const key = `${id}:safety_reveal`;
    const claimed = await claimMany(sb, key, targets.map((t) => t.id), 'email');
    for (const t of targets) {
      if (!claimed.has(t.id)) continue;
      const slot = await takeEmailSlot('urgent');
      if (!slot) {
        await markMany(sb, key, [t.id], 'email', 'skipped_budget');
        continue;
      }
      const mail = safetyRevealMail({ leaderFirstName: t.firstName, memberFirstName: firstName, groupName: t.groupName });
      const res = await sendOne({ ...mail, to: t.email }, `${key}:${t.id}`);
      await markMany(sb, key, [t.id], 'email', res.ok ? 'sent' : 'failed');
    }
    return { ok: true };
  } catch (err) {
    console.error('revealToLeaders failed', err);
    return { ok: false };
  }
}
