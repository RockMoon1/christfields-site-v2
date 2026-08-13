'use server';

import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';
import { leaderAssessmentHtml } from '@/lib/emails';
import { Resend } from 'resend';
import {
  GATES,
  DOCTRINE,
  COMMITMENTS,
  WALK,
  SCENARIOS,
  type AssessmentSubmission,
} from '@/lib/leaders/assessment';

/**
 * Receives a leader readiness assessment.
 *
 * Stores the response first (leader_assessments, migration 014) and treats the
 * email as a notification of that row, the same discipline as the public form:
 * someone who just spent half an hour answering honest questions about their
 * own life should never lose it to a mail provider having a bad minute.
 *
 * Degrades gracefully. Before the migration is run the insert fails and the
 * email alone carries it; if the key is missing but the row stored, that is
 * still a success.
 */

const FROM = process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>';
const NOTIFY = process.env.NOTIFY_EMAIL || 'proverbs@christfields2717.com';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/** Per-person cap. Generous: this is a long form and people do come back. */
const RATE_LIMIT = 3;
const RATE_WINDOW_SECONDS = 60 * 60;

function clean(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

/** Keep only the answers we actually asked for, coerced to the right shape. */
function pickBooleans(input: unknown, ids: string[]): Record<string, boolean> {
  const src = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, boolean> = {};
  for (const id of ids) out[id] = src[id] === true;
  return out;
}

function pickText(input: unknown, ids: string[], max = 4000): Record<string, string> {
  const src = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const id of ids) out[id] = clean(src[id], max);
  return out;
}

export async function submitLeaderAssessment(
  input: AssessmentSubmission,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const name = clean(input?.name, 100);
    const email = clean(input?.email, 254);
    const phone = clean(input?.phone, 40);
    const church = clean(input?.church, 200);
    const isMinor = input?.isMinor === true;
    const guardianName = clean(input?.guardianName, 200);
    const guardianEmail = clean(input?.guardianEmail, 254);

    // Covenant Section 13: a leader under 18 cannot proceed without a guardian.
    if (isMinor && (!guardianName || !EMAIL_RE.test(guardianEmail))) {
      return { ok: false, error: 'Please add a parent or guardian name and email.' };
    }

    if (!name || !EMAIL_RE.test(email) || !church) {
      return { ok: false, error: 'Please fill in your name, email, and church.' };
    }

    const rl = await takeRateLimit(`leader-assess:${email.toLowerCase()}`, RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (rl.durable && !rl.allowed) {
      return { ok: false, error: 'We already have your answers. Give us a little time to read them.' };
    }

    const gates = pickBooleans(input?.gates, GATES.map((g) => g.id));
    const doctrine = pickBooleans(input?.doctrine, DOCTRINE.map((d) => d.id));
    const commitments = pickBooleans(input?.commitments, COMMITMENTS.map((c) => c.id));
    const walk = pickText(input?.walk, WALK.map((w) => w.id));
    const scenarios = pickText(input?.scenarios, SCENARIOS.map((s) => s.id));

    // Recomputed here rather than trusted from the client.
    const gatePassed =
      GATES.every((g) => gates[g.id]) && DOCTRINE.every((d) => doctrine[d.id]);

    let storedId: string | null = null;
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('leader_assessments')
        .insert({
          name,
          email,
          phone: phone || null,
          church,
          is_minor: isMinor,
          guardian_name: guardianName || null,
          guardian_email: guardianEmail || null,
          gates,
          doctrine,
          commitments,
          walk,
          scenarios,
          gate_passed: gatePassed,
        })
        .select('id')
        .single();
      if (error) {
        console.warn('Leader assessment not stored (run migration 014?)', { code: error.code });
      } else {
        storedId = (data?.id as string) ?? null;
      }
    } catch {
      // Fall through to the email path.
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('Leader assessment received, RESEND_API_KEY not set', {
        stored: storedId !== null,
      });
      if (storedId) return { ok: true };
      return { ok: false, error: 'Could not send right now. Please try again.' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    // Resend v6 resolves with { error } rather than throwing.
    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      replyTo: email,
      subject: `Leader readiness: ${name}${gatePassed ? '' : ' (did not pass the gates)'}`,
      html: leaderAssessmentHtml({
        name,
        email,
        phone,
        church,
        isMinor,
        guardianName,
        gatePassed,
        gates,
        doctrine,
        commitments,
        walk,
        scenarios,
      }),
      text: [
        `Leader readiness assessment: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : '',
        `Church: ${church}`,
        `Gates passed: ${gatePassed ? 'yes' : 'no'}`,
        '',
        'Full answers are in the HTML version and in the leader_assessments table.',
      ]
        .filter(Boolean)
        .join('\n'),
    });

    if (sendError) {
      console.error('Leader assessment email failed', {
        name: sendError.name,
        stored: storedId !== null,
      });
      if (!storedId) return { ok: false, error: 'Could not send right now. Please try again.' };
    } else if (storedId) {
      try {
        const sb = getSupabase();
        await sb.from('leader_assessments').update({ emailed: true }).eq('id', storedId);
      } catch {
        // The row simply keeps emailed=false, which is the honest state.
      }
    }

    return { ok: true };
  } catch (err) {
    console.error('submitLeaderAssessment failed', err);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
