'use server';

import { headers } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { takeRateLimit } from '@/lib/rate-limit';
import { leaderAssessmentHtml, guardianNoticeHtml } from '@/lib/emails';
import { Resend } from 'resend';
import {
  GATES,
  DOCTRINE,
  commitmentsFor,
  WALK,
  SCENARIOS,
  SHAREABLE_IDS,
  MINOR_APPLICATIONS_OPEN,
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
 *
 * This action is unauthenticated by design (the page is a link you send, not a
 * login), and it sends mail to an address the caller typed. That combination is
 * an outbound-email primitive on the ministry's own sending domain, so it is
 * limited by IP and by guardian address as well as by applicant email, and it
 * carries a honeypot. Rotating one field is not enough to get past it.
 */

const FROM = process.env.FROM_EMAIL || 'Christ Fields <proverbs@christfields2717.com>';
const NOTIFY = process.env.NOTIFY_EMAIL || 'proverbs@christfields2717.com';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/** Per-person cap. Generous: this is a long form and people do come back. */
const RATE_LIMIT = 3;
const RATE_WINDOW_SECONDS = 60 * 60;

/** Per-network cap. The one a caller cannot reset by editing a field. */
const IP_RATE_LIMIT = 5;

/**
 * Per-guardian-address cap. This is the path that mails a stranger, so it is
 * capped — but never below the per-applicant cap, or a teenager fixing a typo
 * twice would silently switch off their own parent's notification.
 */
const GUARDIAN_RATE_LIMIT = RATE_LIMIT;

/**
 * Words that mean the founder should open this today rather than Tuesday.
 *
 * A blunt instrument, and meant to be. It only changes a subject line, so a
 * false positive costs someone reading a good application sooner, and a missed
 * one costs what it always cost. Never a substitute for reading them all.
 */
const URGENT_TERMS = [
  'kill myself', 'killing myself', 'end my life', 'want to die', 'wanna die',
  'suicide', 'suicidal', 'self harm', 'self-harm', 'harm myself', 'hurt myself',
  'cutting myself', 'cut myself', 'overdose',
  'abused', 'abusive', 'molest', 'raped', 'rape', 'assaulted',
  'hits me', 'hit me', 'beats me', 'beat me', 'touched me',
  'not safe at home', 'unsafe at home', 'scared of my dad', 'scared of my mom',
  'runaway', 'ran away', 'homeless', 'starving',
];

/** Scans only what the applicant wrote about themselves, not the scenarios. */
function needsUrgentRead(walk: Record<string, string>): string[] {
  const hay = Object.values(walk).join(' \n ').toLowerCase();
  return URGENT_TERMS.filter((t) => hay.includes(t));
}

/**
 * Best-effort in-memory fallback, matching app/api/submit/route.ts. Per-instance
 * and reset by a cold start, so not a guarantee, but without it a deploy where
 * migration 011 has not been run has no limiting at all on the one endpoint
 * that can mail a stranger.
 */
const hits = new Map<string, number[]>();

function memoryLimited(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // crude ceiling; correctness does not depend on it
  return recent.length > limit;
}

/** Durable once migration 011 is applied, in-memory before then. Never nothing. */
async function limited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rl = await takeRateLimit(key, limit, windowSeconds);
  return rl.durable ? !rl.allowed : memoryLimited(key, limit, windowSeconds);
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-nf-client-connection-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

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
    // Honeypot: a script filled a field no person can see. Look like success,
    // send nothing, store nothing. Named so no browser or password manager
    // recognises it as something to autofill — a real applicant tripping this
    // would lose everything and be told "thank you".
    if (clean(input?.website, 200)) return { ok: true };

    const name = clean(input?.name, 100);
    const email = clean(input?.email, 254);
    const phone = clean(input?.phone, 40);
    const church = clean(input?.church, 200);
    const isMinor = input?.isMinor === true;
    const guardianName = clean(input?.guardianName, 200);
    const guardianEmail = clean(input?.guardianEmail, 254);

    // The under-18 path is shut until screening is real. Enforced here as well
    // as in the form, because the client is not where a safeguarding gate lives:
    // the whole reason the door is closed is that submitting mails a promise to
    // a parent that nothing behind it can currently keep.
    if (isMinor && !MINOR_APPLICATIONS_OPEN) {
      return {
        ok: false,
        error:
          'We are not open to applicants under 18 yet. Come and be part of Iron and Ember, and ask us again soon.',
      };
    }

    // Covenant Section 13: a leader under 18 cannot proceed without a guardian.
    if (isMinor && (!guardianName || !EMAIL_RE.test(guardianEmail))) {
      return { ok: false, error: 'Please add a parent or guardian name and email.' };
    }

    if (!name || !EMAIL_RE.test(email) || !church) {
      return { ok: false, error: 'Please fill in your name, email, and church.' };
    }

    // Required: what comes next is a phone call, not an email thread.
    if (phone.replace(/\D/g, '').length < 10) {
      return { ok: false, error: 'Please add a phone number we can reach you on.' };
    }

    // Keyed on the network first, because every other key here is a field the
    // caller chooses and can rotate freely.
    const ip = await clientIp();
    if (await limited(`leader-assess-ip:${ip}`, IP_RATE_LIMIT, RATE_WINDOW_SECONDS)) {
      return { ok: false, error: 'Give us a little time before sending another.' };
    }
    if (await limited(`leader-assess:${email.toLowerCase()}`, RATE_LIMIT, RATE_WINDOW_SECONDS)) {
      return { ok: false, error: 'We already have your answers. Give us a little time to read them.' };
    }

    const commitmentSet = commitmentsFor(isMinor);

    const gates = pickBooleans(input?.gates, GATES.map((g) => g.id));
    const doctrine = pickBooleans(input?.doctrine, DOCTRINE.map((d) => d.id));
    const commitments = pickBooleans(input?.commitments, commitmentSet.map((c) => c.id));
    const walk = pickText(input?.walk, WALK.map((w) => w.id));
    const scenarios = pickText(input?.scenarios, SCENARIOS.map((s) => s.id));

    // Shared unless the applicant explicitly said otherwise, so a dropped or
    // malformed value always errs toward the parent seeing it rather than
    // toward silence. Only under-18 applicants ever see these switches.
    const rawVisibility = (input?.visibility ?? {}) as Record<string, unknown>;
    const visibility: Record<string, boolean> = {};
    for (const id of SHAREABLE_IDS) visibility[id] = rawVisibility[id] !== false;

    // Recomputed here rather than trusted from the client.
    const gatePassed =
      GATES.every((g) => gates[g.id]) && DOCTRINE.every((d) => doctrine[d.id]);

    // A "no" to any of these outweighs everything else on the form, so it has
    // to be visible in the subject line rather than buried in row eleven of a
    // seventeen-row table.
    const declined = commitmentSet
      .filter((c) => c.nonNegotiable && !commitments[c.id])
      .map((c) => c.question);

    const core = {
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
    };

    let storedId: string | null = null;
    try {
      const sb = getSupabase();
      const insert = (row: Record<string, unknown>) =>
        sb.from('leader_assessments').insert(row).select('id').single();

      // PostgREST rejects the WHOLE row when one column is missing from its
      // schema cache (PGRST204), so sending `visibility` before migration 016
      // has run would lose the entire submission rather than just the record of
      // which answers were shared. Try the full row, fall back to the core one.
      let { data, error } = await insert({ ...core, visibility: isMinor ? visibility : {} });
      if (error?.code === 'PGRST204') {
        console.warn('Storing without visibility (run migration 016)', { code: error.code });
        ({ data, error } = await insert(core));
      }
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
        // Loud on purpose: an under-18 submission means a parent is now owed a
        // call that the code did not make.
        guardianNoticeSkipped: isMinor,
      });
      if (storedId) return { ok: true };
      return { ok: false, error: 'Could not send right now. Please try again.' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const answerFor = (id: string) => walk[id] ?? scenarios[id] ?? '';
    const promptFor = (id: string) =>
      WALK.find((w) => w.id === id)?.prompt ??
      SCENARIOS.find((s) => s.id === id)?.ask ??
      id;

    /* ---- The guardian first. It is the message with a clock on it. ---- */
    // Whether the parent actually heard, so the founder's own copy can say so
    // instead of it living in a log line nobody reads.
    let guardianStatus: 'sent' | 'failed' | 'suppressed' | 'none' = 'none';

    if (isMinor && guardianEmail) {
      // One recipient cannot be mailed repeatedly no matter what else rotates.
      if (await limited(`leader-assess-guardian:${guardianEmail.toLowerCase()}`, GUARDIAN_RATE_LIMIT, RATE_WINDOW_SECONDS)) {
        guardianStatus = 'suppressed';
      } else {
        const hasAnswers = SHAREABLE_IDS.some((id) => answerFor(id).trim());

        const { error: guardianError } = await resend.emails.send({
          from: FROM,
          to: guardianEmail,
          replyTo: NOTIFY,
          subject: `${name} asked about leading a small group with Christ Fields`,
          html: guardianNoticeHtml({
            guardianName: guardianName || 'Hello',
            leaderName: name,
            hasAnswers,
          }),
          text: [
            `${guardianName},`,
            '',
            `${name} has asked to be considered for leading a small group with us, and gave us your email because they are under 18. Nothing has been decided and nothing has been signed.`,
            '',
            'Leading here means being at the gatherings twice a week alongside a co-leader, never alone. A leader under 18 always serves under a screened adult and is never solely responsible for a group. No adult is ever alone one on one with a minor.',
            '',
            'If this goes further, our Leadership Covenant needs your signature alongside theirs, walked through in person and given to you at least seven days before anyone signs.',
            '',
            'What we asked them about: their own prayer and Scripture, who holds them accountable, what they are struggling with, why they want to lead, and how they would handle real situations with young people. Reply and we will send you the full list of questions.',
            '',
            ...(hasAnswers
              ? [
                  `${name} wrote answers to all of it, and chose, question by question, which of them we may show you. Nothing is attached here, because this email left the moment they pressed send and none of us has read a word yet. Once we have, we will send you what they chose to share, and the rest is theirs to tell you in their own time.`,
                  '',
                  `We gave them that choice on purpose. A young person who knows every word goes straight home tends to write what sounds right rather than what is true, and the truth is what keeps them safe. What we will not do is sit on something. If anything they write makes us think ${name} is not safe, we act on it, and depending on what it is that means a phone call to you, and it may mean the people whose job it is to keep them safe.`,
                  '',
                ]
              : []),
            'Their answers are kept in our records. Reply at any time to ask us to delete them, or if you would rather they did not go further.',
            '',
            'Lisandro',
            'Christ Fields',
          ]
            .filter(Boolean)
            .join('\n'),
        });

        if (guardianError) {
          // Worth knowing about: the founder may need to reach the parent
          // another way. Never fails the submission, already safely stored.
          guardianStatus = 'failed';
          console.error('Guardian notice failed', { name: guardianError.name });
        } else {
          guardianStatus = 'sent';
          if (storedId) {
            const sb = getSupabase();
            const { error } = await sb
              .from('leader_assessments')
              .update({ guardian_emailed: true })
              .eq('id', storedId);
            // supabase-js resolves with { error } rather than throwing, so this
            // has to be read or a missing column fails silently forever.
            if (error) {
              console.warn('guardian_emailed not recorded (run migration 015?)', { code: error.code });
            }
          }
        }
      }
    }

    /* ---- Then the Table. ---- */
    const urgent = needsUrgentRead(walk);

    // What the young person chose to let their parent see, assembled here so
    // the founder has it ready to forward once they have actually read it.
    const forwardable = isMinor
      ? SHAREABLE_IDS.filter((id) => visibility[id] && answerFor(id).trim()).map((id) => ({
          prompt: promptFor(id),
          answer: answerFor(id),
        }))
      : [];
    const withheldCount = isMinor
      ? SHAREABLE_IDS.filter((id) => !visibility[id] && answerFor(id).trim()).length
      : 0;

    const flags = [
      // First, because it is the only one that changes what you do tonight.
      urgent.length ? 'READ TODAY — ' : '',
      isMinor ? ' (under 18)' : '',
      gatePassed ? '' : ' (did not pass the gates)',
      declined.length ? ' (declined a non-negotiable)' : '',
      guardianStatus === 'failed' || guardianStatus === 'suppressed'
        ? ' (GUARDIAN NOT EMAILED)'
        : '',
    ];

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      // Covenant Section 14 and c_minor_channels: replying to a minor's own
      // address would open exactly the private one-to-one thread this form
      // asks every applicant to swear off.
      replyTo: isMinor ? guardianEmail || NOTIFY : email,
      subject: `${flags[0]}Leader readiness: ${name}${flags.slice(1).join('')}`,
      html: leaderAssessmentHtml({
        name,
        email,
        phone,
        church,
        isMinor,
        guardianName,
        guardianEmail,
        guardianStatus,
        urgent,
        forwardable,
        withheldCount,
        gatePassed,
        declined,
        commitmentSet,
        gates,
        doctrine,
        commitments,
        walk,
        scenarios,
        // So the email reads as questions and answers rather than as a table of
        // snake_case ids next to paragraphs.
        questionText: Object.fromEntries(SHAREABLE_IDS.map((id) => [id, promptFor(id)])),
        visibility: isMinor ? visibility : undefined,
      }),
      text: [
        urgent.length
          ? `READ TODAY. Their own answers mention: ${urgent.join(', ')}. This is a keyword match, not a judgment — read it now and decide.`
          : '',
        `Leader readiness assessment: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : '',
        `Church: ${church}`,
        isMinor ? `UNDER 18. Guardian: ${guardianName} <${guardianEmail}>. Reply to the guardian, not to the applicant.` : '',
        guardianStatus === 'suppressed'
          ? 'GUARDIAN NOT EMAILED — rate limit. Contact them yourself today.'
          : '',
        guardianStatus === 'failed'
          ? 'GUARDIAN NOT EMAILED — the send failed. Contact them yourself today.'
          : '',
        `Gates passed: ${gatePassed ? 'yes' : 'no'}`,
        declined.length ? `DECLINED A NON-NEGOTIABLE: ${declined.join(' | ')}` : '',
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
      const sb = getSupabase();
      const { error } = await sb
        .from('leader_assessments')
        .update({ emailed: true })
        .eq('id', storedId);
      if (error) console.warn('emailed flag not recorded', { code: error.code });
    }

    return { ok: true };
  } catch (err) {
    console.error('submitLeaderAssessment failed', err);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
