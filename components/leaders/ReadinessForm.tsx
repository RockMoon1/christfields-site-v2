'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ScriptureSymbol } from '@/components/motion/ScriptureSymbol';
import { submitLeaderAssessment } from '@/app/leaders/readiness/actions';
import {
  GATES,
  DOCTRINE,
  commitmentsFor,
  WALK,
  SCENARIOS,
  CRISIS_LINE,
  CRISIS_LINE_IDS,
  type Scripture,
} from '@/lib/leaders/assessment';

/**
 * The leader readiness assessment.
 *
 * Built as one step at a time rather than a wall of fields, because the
 * questions deserve to be read rather than skimmed. Four things gate it and end
 * it immediately: the three yes/no questions, and the doctrinal affirmation.
 * Someone this was never going to fit should find that out in ninety seconds,
 * not after half an hour of writing.
 *
 * Nothing here scores or judges on the client. Every answer goes to the
 * founder to read.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Phase = 'intro' | 'gates' | 'doctrine' | 'about' | 'commitments' | 'walk' | 'scenarios' | 'done' | 'stopped';

/** Why the form ended, so the closing screen can say the true thing. */
type StopReason = 'gate' | 'doctrine' | 'age';

/**
 * Draft storage.
 *
 * This is half an hour and twelve essay boxes. Held only in React state, a
 * phone call, a dead battery, or a stray back-swipe takes all of it, including
 * the answer about what someone is struggling with — and that is a far more
 * likely way to hurt an applicant than anything in the scenarios.
 *
 * Only the written answers are kept, never the name, email, phone, church, or
 * guardian details: a draft on a shared family computer should not be a
 * readable dossier, and it should never be the thing that tells a parent their
 * child applied. It is cleared the moment the form is sent, and the applicant
 * is told it exists and given a button to erase it.
 */
const DRAFT_KEY = 'cf-leader-readiness-draft';

type Draft = { walk: Record<string, string>; scenarios: Record<string, string> };

function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    const w = parsed?.walk ?? {};
    const s = parsed?.scenarios ?? {};
    if (!Object.values({ ...w, ...s }).some((v) => typeof v === 'string' && v.trim())) return null;
    return { walk: w, scenarios: s };
  } catch {
    return null;
  }
}

function VerseLine({ scripture }: { scripture: Scripture }) {
  return (
    <p className="mt-3 border-l-2 border-gold/30 pl-3 font-display text-sm italic leading-relaxed text-silver">
      {scripture.text}
      <span className="mt-1 block text-[10px] uppercase not-italic tracking-[0.16em] text-gold-lt">
        {scripture.ref}
      </span>
    </p>
  );
}

function StepShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        {eyebrow}
      </p>
      <h2 className="mb-3 font-display text-3xl font-light leading-tight text-ivory md:text-4xl">
        {title}
      </h2>
      {lede && <p className="mb-8 max-w-xl text-sm leading-relaxed text-silver">{lede}</p>}
      {children}
    </motion.div>
  );
}

/**
 * Per-answer control for an under-18 applicant: does this one go in the email
 * their guardian receives? Defaults to yes.
 *
 * The wording is deliberate. It never claims the answer is hidden, because it
 * is not: the Table still reads everything, and a safety concern still reaches
 * a parent. It only controls the automatic copy.
 */
function ShareToggle({
  shared,
  onChange,
  id,
}: {
  shared: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!shared)}
      aria-pressed={shared}
      aria-label={
        shared
          ? 'Your parent or guardian may be shown this answer. Tap to keep it from them.'
          : 'This answer will be kept from your parent or guardian. Tap to share it.'
      }
      className={cn(
        'mt-3 inline-flex min-h-[44px] items-center gap-2.5 rounded-sm border px-3 py-2 text-[11px] transition-colors',
        shared
          ? 'border-emerald-lt/40 bg-emerald-lt/[0.07] text-emerald-bright'
          : 'border-border-sub text-silver hover:border-border-gold',
      )}
      id={`share-${id}`}
    >
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-7 items-center rounded-full px-0.5 transition-colors',
          shared ? 'justify-end bg-emerald-lt/70' : 'justify-start bg-border-sub',
        )}
      >
        <span className="block h-3 w-3 rounded-full bg-black-2" />
      </span>
      {shared ? 'Your parent may see this' : 'Kept from your parent'}
    </button>
  );
}

/**
 * A door left open, under the two questions heavy enough to need one.
 * Deliberately quiet: it is not an alarm about the person reading it.
 */
function CrisisLine() {
  return (
    <p className="mt-3 rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-[11px] leading-relaxed text-silver">
      {CRISIS_LINE.lead}{' '}
      {/* The number is written out, not hidden behind a link: tel: does
          nothing on most desktops, and this has to work everywhere. */}
      <a href="tel:988" className="font-medium text-gold-lt underline underline-offset-2">
        988
      </a>
      {CRISIS_LINE.body}
    </p>
  );
}

function YesNo({
  value,
  onChange,
  idPrefix,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  idPrefix: string;
}) {
  return (
    <div className="mt-4 flex gap-3" role="group" aria-label="Yes or no">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          id={`${idPrefix}-${v ? 'yes' : 'no'}`}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={cn(
            'min-h-[44px] flex-1 rounded-sm border px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
            value === v
              ? v
                ? 'border-emerald-lt/60 bg-emerald-lt/15 text-emerald-bright'
                : 'border-gold/60 bg-gold/15 text-gold-lt'
              : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
          )}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

export function ReadinessForm() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stopReason, setStopReason] = useState<StopReason>('gate');
  const [gateIndex, setGateIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  // Never shown to a person. A script filling every field trips it.
  const [website, setWebsite] = useState('');

  const [gates, setGates] = useState<Record<string, boolean>>({});
  const [doctrine, setDoctrine] = useState<Record<string, boolean>>({});
  const [commitments, setCommitments] = useState<Record<string, boolean>>({});
  const [walk, setWalk] = useState<Record<string, string>>({});
  const [scenarios, setScenarios] = useState<Record<string, string>>({});
  // Under-18 only. Everything is shared with their guardian unless they say
  // otherwise, so the default is trust in both directions.
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const isShared = (id: string) => visibility[id] !== false;
  const setShared = (id: string, v: boolean) =>
    setVisibility((m) => ({ ...m, [id]: v }));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [church, setChurch] = useState('');
  // The covenant allows leaders under 18 (Section 14), serving under a screened
  // adult, and it needs a parent or guardian co-signature (Section 13). Below
  // fourteen the form stops and stores nothing: the privacy policy says this
  // site does not knowingly collect from under-13s, and a covenant written
  // around a minor serving under a screened adult does not envision a child.
  const [ageBand, setAgeBand] = useState<'adult' | 'teen' | 'child' | null>(null);
  const isMinor = ageBand === 'teen';
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  const COMMITMENT_SET = commitmentsFor(isMinor);

  const [restored, setRestored] = useState(false);
  const hydrated = useRef(false);

  // Restore once, before anything is typed.
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setWalk(d.walk);
      setScenarios(d.scenarios);
      setRestored(true);
    }
    hydrated.current = true;
  }, []);

  // Save as they write. Guarded so the empty first render cannot wipe a draft
  // before the restore above has run.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ walk, scenarios }));
    } catch {
      // Private mode, or a full quota. Losing the draft is not worth an error.
    }
  }, [walk, scenarios]);

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to do, and nothing worth saying */
    }
  }

  function forgetDraft() {
    clearDraft();
    setWalk({});
    setScenarios({});
    setRestored(false);
  }

  function stop(reason: StopReason) {
    setStopReason(reason);
    setPhase('stopped');
  }

  function answerGate(value: boolean) {
    const gate = GATES[gateIndex];
    setGates((g) => ({ ...g, [gate.id]: value }));
    if (!value) {
      stop('gate');
      return;
    }
    if (gateIndex + 1 < GATES.length) setGateIndex(gateIndex + 1);
    else setPhase('doctrine');
  }

  const allDoctrine = DOCTRINE.every((d) => doctrine[d.id]);
  const commitmentsAnswered = COMMITMENT_SET.every(
    (c) => typeof commitments[c.id] === 'boolean',
  );
  const walkDone = WALK.every((w) => (walk[w.id] ?? '').trim().length >= w.minChars);
  const scenariosDone = SCENARIOS.every(
    (s) => (scenarios[s.id] ?? '').trim().length >= s.minChars,
  );
  const guardianDone =
    ageBand === 'adult' ||
    (isMinor &&
      guardianName.trim().length > 1 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail));
  const aboutDone =
    name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && church.trim() && guardianDone;

  function submit() {
    setError('');
    startTransition(async () => {
      const res = await submitLeaderAssessment({
        name,
        email,
        phone,
        church,
        website,
        isMinor,
        guardianName,
        guardianEmail,
        gates,
        doctrine,
        commitments,
        walk,
        scenarios,
        visibility,
      }).catch(() => ({ ok: false, error: 'Something went wrong. Please try again.' }));
      if (res.ok) {
        // It is with us now. Nothing personal stays on this device.
        clearDraft();
        setPhase('done');
      } else setError(res.error ?? 'Could not send. Please try again.');
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AnimatePresence mode="wait">
        {/* ---------------- Intro ---------------- */}
        {phase === 'intro' && (
          <motion.div key="intro" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: EASE }}>
            <StepShell
              eyebrow="Before you begin"
              title="This asks a lot of you."
              lede="It is meant to. Leading people is a weight, and the point of these questions is to find out together whether this is your season for it. There are no trick questions and no right-sounding answers. Say the true thing."
            >
              <div className="rounded-sm border border-border-sub bg-black-3 p-6">
                <p className="text-sm leading-relaxed text-ivory-dim">
                  The first few questions decide whether the rest is worth your time. If one of
                  them is a no, we will say so straight away rather than let you spend half an
                  hour on something that was never going to fit.
                </p>
                {/* Used throughout, and it carries the privacy promise. A
                    stranger should never have to guess what it means. */}
                <p className="mt-4 border-t border-border-sub pt-4 text-xs leading-relaxed text-silver">
                  You will see us say <span className="text-ivory">the Table</span>. That is the
                  small group of people who lead Iron and Ember together and who make this
                  decision. It is not software and it is not a committee somewhere else; it is a
                  handful of named people, and they are the only ones who read this.
                </p>
                <VerseLine
                  scripture={{
                    ref: 'James 3:1',
                    text:
                      '“Let not many of you be teachers, my brothers, knowing that we will receive heavier judgment.”',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setPhase('gates')}
                className="mt-8 w-full rounded-sm bg-gold px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt"
              >
                Begin
              </button>
            </StepShell>
          </motion.div>
        )}

        {/* ---------------- Gates ---------------- */}
        {phase === 'gates' && (
          <motion.div key={`gate-${gateIndex}`} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <StepShell
              eyebrow={`Question ${gateIndex + 1} of ${GATES.length}`}
              title={GATES[gateIndex].question}
            >
              <div className="rounded-sm border border-border-sub bg-black-3 p-6">
                <p className="text-sm leading-relaxed text-ivory-dim">{GATES[gateIndex].help}</p>
                <VerseLine scripture={GATES[gateIndex].scripture} />
              </div>
              <YesNo value={gates[GATES[gateIndex].id] ?? null} onChange={answerGate} idPrefix={GATES[gateIndex].id} />
            </StepShell>
          </motion.div>
        )}

        {/* ---------------- Doctrine ---------------- */}
        {phase === 'doctrine' && (
          <motion.div key="doctrine" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <StepShell
              eyebrow="What we hold to"
              title="Do you believe these?"
              lede="Not our preferences, and not the things Christians disagree about in good faith. These are what the church has confessed from the beginning. Check each one you can affirm honestly."
            >
              <div className="flex flex-col gap-3">
                {DOCTRINE.map((d) => {
                  const checked = !!doctrine[d.id];
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDoctrine((m) => ({ ...m, [d.id]: !m[d.id] }))}
                      aria-pressed={checked}
                      className={cn(
                        'rounded-sm border p-5 text-left transition-colors',
                        checked
                          ? 'border-emerald-lt/50 bg-emerald-lt/[0.07]'
                          : 'border-border-sub bg-black-3 hover:border-border-gold',
                      )}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border',
                            checked ? 'border-emerald-lt bg-emerald-lt text-black' : 'border-border-sub',
                          )}
                        >
                          {checked && (
                            <svg viewBox="0 0 16 16" className="h-3 w-3">
                              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm leading-relaxed text-ivory">{d.statement}</span>
                          <span className="mt-1.5 block text-[11px] uppercase tracking-[0.14em] text-gold-lt">
                            {d.scripture.ref}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!allDoctrine}
                onClick={() => setPhase('about')}
                className="mt-6 w-full rounded-sm bg-gold px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>

              {/* This is the fourth gate, and it has to be able to end the form
                  the way the other three do. Without a way out, someone who
                  cannot affirm one of these is left staring at a dead button
                  with no idea what to do next. */}
              {!allDoctrine && (
                <div className="mt-5 rounded-sm border border-border-sub bg-black-3 p-5">
                  <p className="text-xs leading-relaxed text-silver">
                    If one of these is something you are still working through, that is an
                    honest place to be, and it is worth a conversation rather than a checkbox.
                  </p>
                  <button
                    type="button"
                    onClick={() => stop('doctrine')}
                    className="mt-3 min-h-[44px] w-full rounded-sm border border-border-gold px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-lt transition-colors hover:bg-gold hover:text-black"
                  >
                    I cannot affirm all of these
                  </button>
                </div>
              )}
            </StepShell>
          </motion.div>
        )}

        {/* ---------------- About ---------------- */}
        {phase === 'about' && (
          <motion.div key="about" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <StepShell eyebrow="Who you are" title="Tell us where to find you.">
              <div className="flex flex-col gap-4">
                {[
                  { id: 'ln', label: 'Your name', value: name, set: setName, type: 'text', ac: 'name' },
                  { id: 'le', label: 'Email', value: email, set: setEmail, type: 'email', ac: 'email' },
                  { id: 'lp', label: 'Phone (optional)', value: phone, set: setPhone, type: 'tel', ac: 'tel' },
                  { id: 'lc', label: 'The church you attend and serve at', value: church, set: setChurch, type: 'text', ac: 'organization' },
                ].map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                      {f.label}
                    </label>
                    <input
                      id={f.id}
                      type={f.type}
                      autoComplete={f.ac}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      maxLength={200}
                      className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              {/* Covenant Section 13: a leader under 18 needs a parent or
                  guardian co-signature, so we need to know now rather than
                  discover it at the signing table. */}
              <div className="mt-6 rounded-sm border border-border-sub bg-black-3 p-5">
                <p className="text-sm text-ivory">How old are you?</p>
                <p className="mt-1 text-xs leading-relaxed text-silver">
                  Leaders under 18 serve here, always under a screened adult — meaning a background
                  check and references, renewed. It just means a parent or guardian signs the
                  covenant alongside you.
                </p>
                {/* The one question on this form somebody has a reason to lie
                    about, and every protection for a young person hangs on it.
                    Naming that is the only lever we have. */}
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Answer this one straight. It is the only question here that changes how we look
                  after you, and every protection you are owed is built on it.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {([
                    { label: '18 or older', band: 'adult' },
                    { label: '14 to 17', band: 'teen' },
                    { label: '13 or younger', band: 'child' },
                  ] as const).map((o) => (
                    <button
                      key={o.band}
                      type="button"
                      onClick={() => {
                        setAgeBand(o.band);
                        // Nothing is collected from a child here. The form ends
                        // before a single personal question is asked.
                        if (o.band === 'child') stop('age');
                      }}
                      aria-pressed={ageBand === o.band}
                      className={cn(
                        'min-h-[44px] flex-1 rounded-sm border px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors',
                        ageBand === o.band
                          ? 'border-gold/60 bg-gold/15 text-gold-lt'
                          : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {isMinor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 flex flex-col gap-4 overflow-hidden"
                  >
                    <div>
                      <label htmlFor="lgn" className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                        Parent or guardian name
                      </label>
                      <input
                        id="lgn"
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        maxLength={200}
                        className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-sm text-ivory focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="lge" className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                        Their email
                      </label>
                      <input
                        id="lge"
                        type="email"
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        maxLength={254}
                        className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-sm text-ivory focus:border-gold focus:outline-none"
                      />
                    </div>

                    {/* Said before they answer the honest questions, not after.
                        They should know exactly who hears what. */}
                    <div className="rounded-sm border border-gold/30 bg-gold/[0.05] p-4">
                      <p className="text-xs leading-relaxed text-ivory-dim">
                        We will email them as soon as you finish, to let them know you asked
                        about this and what leading here involves. That email has none of your
                        answers in it.
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-silver">
                        Under each written question you will find a switch. Leave it on and your
                        parent may see that answer. Turn it off and they will not. You decide,
                        one answer at a time. Nothing goes to them automatically: a person here
                        reads what you wrote first, and then sends on what you left switched on.
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-silver">
                        Two things we will not pretend about. Turning a switch off does not hide
                        anything from us; the Table still reads everything you write, because
                        that is what you are asking us to weigh. And if you tell us something
                        that makes us think you are not safe, we will not sit on it. We will get
                        help. Depending on what it is, that may mean talking to your parents, and
                        it may mean the people whose job it is to keep you safe. We cannot promise
                        to keep that kind of thing secret, and we would not want to.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Never seen or focused by a person. */}
              <div aria-hidden className="h-px w-px overflow-hidden opacity-0">
                <label htmlFor="lw">Website</label>
                <input
                  id="lw"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <button
                type="button"
                disabled={!aboutDone}
                onClick={() => setPhase('commitments')}
                className="mt-8 w-full rounded-sm bg-gold px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </StepShell>
          </motion.div>
        )}

        {/* ---------------- Commitments ---------------- */}
        {phase === 'commitments' && (
          <motion.div key="commitments" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <StepShell
              eyebrow="What this asks of you"
              title="The commitments."
              lede="Answer these the way you would actually live them, not the way they are supposed to sound. A no here is information, not a failure."
            >
              <div className="flex flex-col gap-5">
                {COMMITMENT_SET.map((c, i) => (
                  <div
                    key={c.id}
                    className={cn(
                      'rounded-sm border bg-black-3 p-5',
                      c.nonNegotiable ? 'border-gold/40' : 'border-border-sub',
                    )}
                  >
                    {(c.nonNegotiable || c.covenant) && (
                      <p className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
                        {c.nonNegotiable && (
                          <span className="rounded-sm border border-gold/40 bg-gold/10 px-2 py-0.5 text-gold-lt">
                            Not negotiable
                          </span>
                        )}
                        {c.covenant && <span className="text-muted">Covenant {c.covenant}</span>}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed text-ivory">
                      <span className="mr-2 text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                      {c.question}
                    </p>
                    {c.help && <p className="mt-2 text-xs leading-relaxed text-silver">{c.help}</p>}
                    <VerseLine scripture={c.scripture} />
                    {c.alsoScripture && <VerseLine scripture={c.alsoScripture} />}
                    <YesNo
                      value={typeof commitments[c.id] === 'boolean' ? commitments[c.id] : null}
                      onChange={(v) => setCommitments((m) => ({ ...m, [c.id]: v }))}
                      idPrefix={c.id}
                    />
                    {/* Told here, not discovered at the end. These do not stop
                        the form — an honest no is worth reading, and cutting
                        someone off would only teach them to lie next time. But
                        they should not spend another twenty minutes believing
                        it made no difference. */}
                    {c.nonNegotiable && commitments[c.id] === false && (
                      <p className="mt-3 rounded-sm border border-gold/35 bg-gold/[0.06] px-3 py-2.5 text-xs leading-relaxed text-ivory-dim">
                        We would rather you said that than pretended. Be aware it is a stopping
                        point for leading, so this will not end with a yes. You are welcome to keep
                        going and we will still read every word, and it is worth a conversation
                        either way.
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={!commitmentsAnswered}
                onClick={() => setPhase('walk')}
                className="mt-8 w-full rounded-sm bg-gold px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt disabled:cursor-not-allowed disabled:opacity-40"
              >
                {commitmentsAnswered ? 'Continue' : 'Answer each one to continue'}
              </button>
            </StepShell>
          </motion.div>
        )}

        {/* ---------------- Walk ---------------- */}
        {phase === 'walk' && (
          <motion.div key="walk" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <StepShell
              eyebrow="Your own walk"
              title="Before you carry anyone else."
              lede="Nobody reading this is looking for a polished answer. They are looking for a true one."
            >
              {/* Said once, where the writing starts. */}
              <div className="mb-6 rounded-sm border border-border-sub bg-black-3 px-4 py-3">
                <p className="text-xs leading-relaxed text-silver">
                  {restored
                    ? 'We brought back what you had written before. It is saved on this device as you type, so a phone call or a closed tab will not cost you the whole evening.'
                    : 'What you write is saved on this device as you type, so a phone call or a closed tab will not cost you the whole evening. It is erased the moment you send it to us.'}
                </p>
                <button
                  type="button"
                  onClick={forgetDraft}
                  className="mt-2 min-h-[44px] text-[11px] uppercase tracking-[0.12em] text-gold-lt underline underline-offset-4 hover:text-gold"
                >
                  Erase it from this device
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {WALK.map((w) => (
                  <div key={w.id} className="rounded-sm border border-border-sub bg-black-3 p-5">
                    <label htmlFor={w.id} className="block text-sm leading-relaxed text-ivory">
                      {w.prompt}
                    </label>
                    {w.help && <p className="mt-2 text-xs leading-relaxed text-silver">{w.help}</p>}
                    {w.scripture && <VerseLine scripture={w.scripture} />}
                    <textarea
                      id={w.id}
                      value={walk[w.id] ?? ''}
                      onChange={(e) => setWalk((m) => ({ ...m, [w.id]: e.target.value }))}
                      placeholder={w.placeholder}
                      rows={4}
                      maxLength={4000}
                      className="mt-3 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-sm leading-relaxed text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
                    />
                    <p className="mt-1 text-right text-[10px] text-muted">
                      {(walk[w.id] ?? '').trim().length < w.minChars
                        ? 'keep going when you are ready'
                        : 'thank you'}
                    </p>
                    {CRISIS_LINE_IDS.includes(w.id) && <CrisisLine />}
                    {isMinor && (
                      <ShareToggle
                        id={w.id}
                        shared={isShared(w.id)}
                        onChange={(v) => setShared(w.id, v)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={!walkDone}
                onClick={() => setPhase('scenarios')}
                className="mt-8 w-full rounded-sm bg-gold px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </StepShell>
          </motion.div>
        )}

        {/* ---------------- Scenarios ---------------- */}
        {phase === 'scenarios' && (
          <motion.div key="scenarios" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <StepShell
              eyebrow="Nights that will happen"
              title="What would you actually do?"
              lede="These are not hypothetical. Every one of them has happened. Walk us through your thinking, not the right answer."
            >
              <div className="flex flex-col gap-6">
                {SCENARIOS.map((s) => (
                  <div key={s.id} className="rounded-sm border border-border-sub bg-black-3 p-5">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-gold">
                      {s.title}
                    </p>
                    <p className="text-sm leading-relaxed text-ivory-dim">{s.situation}</p>
                    {/* A minor is barred from ever holding that room alone, so
                        asking them to answer as the responsible adult grades
                        them on a call they are not allowed to make. */}
                    <label htmlFor={s.id} className="mt-3 block text-sm font-medium leading-relaxed text-ivory">
                      {isMinor && s.askMinor ? s.askMinor : s.ask}
                    </label>
                    <VerseLine scripture={s.scripture} />
                    <textarea
                      id={s.id}
                      value={scenarios[s.id] ?? ''}
                      onChange={(e) => setScenarios((m) => ({ ...m, [s.id]: e.target.value }))}
                      rows={6}
                      maxLength={4000}
                      className="mt-3 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2.5 text-sm leading-relaxed text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
                      placeholder="Take your time."
                    />
                    <p className="mt-1 text-right text-[10px] text-muted">
                      {(scenarios[s.id] ?? '').trim().length < s.minChars
                        ? 'keep going when you are ready'
                        : 'thank you'}
                    </p>
                    {CRISIS_LINE_IDS.includes(s.id) && <CrisisLine />}
                    {isMinor && (
                      <ShareToggle
                        id={s.id}
                        shared={isShared(s.id)}
                        onChange={(v) => setShared(s.id, v)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <p role="alert" className="mt-6 rounded-sm border border-gold/35 bg-gold/[0.07] px-4 py-3 text-sm text-ivory-dim">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={!scenariosDone || isPending}
                onClick={submit}
                className="mt-8 w-full rounded-sm bg-gold px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? 'Sending...' : 'Send my answers'}
              </button>
            </StepShell>
          </motion.div>
        )}

        {/* ---------------- Stopped at a gate ---------------- */}
        {phase === 'stopped' && (
          <motion.div key="stopped" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <div className="rounded-sm border border-border-gold bg-black-3 p-8 text-center">
              <ScriptureSymbol className="mb-4 block text-3xl text-gold" />
              <h2 className="mb-4 font-display text-3xl font-light text-ivory">
                {stopReason === 'age' ? 'Not yet, and that is all this means.' : 'Then this is not the season.'}
              </h2>
              {stopReason === 'age' ? (
                <>
                  <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-ivory-dim">
                    Leading a group here starts at fourteen, and there is a real reason for it:
                    a leader carries other people, sometimes on their hardest nights, and that is
                    a weight we are not willing to hand to someone younger.
                  </p>
                  <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-silver">
                    Nothing you typed has been kept. Come and be part of Iron and Ember in the
                    meantime, and if you want to be here, ask a parent to reach out to us.
                  </p>
                </>
              ) : (
                <>
                  <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-ivory-dim">
                    {stopReason === 'doctrine'
                      ? 'Saying so plainly instead of ticking a box you did not mean is the honest thing, and it is worth more to us than a form that came back complete.'
                      : 'That is not a judgment on you, and it is not a door closing. Leading a group here asks for those specific things, and answering honestly instead of telling us what we wanted to hear is exactly the character we would want in a leader anyway.'}
                  </p>
                  <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-silver">
                    Come and be part of Iron and Ember. That is where leaders come from here,
                    never from a form.
                  </p>
                </>
              )}
              <p className="font-display text-sm italic text-silver">
                “There is a season for everything, and a time for every purpose under heaven.”
                <span className="mt-1 block text-[10px] uppercase not-italic tracking-[0.16em] text-gold-lt">
                  Ecclesiastes 3:1
                </span>
              </p>
              <a
                href="/faithflow#get-involved"
                className="mt-8 inline-block rounded-sm border border-border-gold px-6 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-lt transition-colors hover:bg-gold hover:text-black"
              >
                Say hello instead
              </a>
            </div>
          </motion.div>
        )}

        {/* ---------------- Done ---------------- */}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <div className="rounded-sm border border-border-gold bg-black-3 p-8 text-center">
              <ScriptureSymbol className="mb-4 block text-3xl text-gold" />
              <h2 className="mb-4 font-display text-3xl font-light text-ivory">Thank you.</h2>
              <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-ivory-dim">
                That took real time and real honesty, and it will be read that way. Someone will
                reach out personally. There is no automatic yes and no automatic no here, and
                whatever comes next starts with a conversation.
              </p>
              <p className="font-display text-sm italic text-silver">
                “Whoever is faithful with very little is also faithful with much.”
                <span className="mt-1 block text-[10px] uppercase not-italic tracking-[0.16em] text-gold-lt">
                  Luke 16:10
                </span>
              </p>
              {/* Some of what they just wrote was heavy. Nobody should be sent
                  away from it with nothing but thank you. */}
              <div className="mx-auto mt-6 max-w-md text-left">
                <CrisisLine />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
