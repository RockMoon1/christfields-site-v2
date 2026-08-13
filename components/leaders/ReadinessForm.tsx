'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ScriptureSymbol } from '@/components/motion/ScriptureSymbol';
import { submitLeaderAssessment } from '@/app/leaders/readiness/actions';
import {
  GATES,
  DOCTRINE,
  COMMITMENTS,
  WALK,
  SCENARIOS,
  type Scripture,
} from '@/lib/leaders/assessment';

/**
 * The leader readiness assessment.
 *
 * Built as one step at a time rather than a wall of fields, because the
 * questions deserve to be read rather than skimmed. The four gates come first
 * and end the form immediately on a "no": someone who cannot make those
 * commitments should find that out in ninety seconds, not after half an hour
 * of writing.
 *
 * Nothing here scores or judges on the client. Every answer goes to the
 * founder to read.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Phase = 'intro' | 'gates' | 'doctrine' | 'about' | 'commitments' | 'walk' | 'scenarios' | 'review' | 'done' | 'stopped';

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
  const [gateIndex, setGateIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [gates, setGates] = useState<Record<string, boolean>>({});
  const [doctrine, setDoctrine] = useState<Record<string, boolean>>({});
  const [commitments, setCommitments] = useState<Record<string, boolean>>({});
  const [walk, setWalk] = useState<Record<string, string>>({});
  const [scenarios, setScenarios] = useState<Record<string, string>>({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [church, setChurch] = useState('');
  // The covenant allows leaders under 18 (Section 14), serving under a screened
  // adult, and it needs a parent or guardian co-signature (Section 13).
  const [isMinor, setIsMinor] = useState<boolean | null>(null);
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  function answerGate(value: boolean) {
    const gate = GATES[gateIndex];
    setGates((g) => ({ ...g, [gate.id]: value }));
    if (!value) {
      setPhase('stopped');
      return;
    }
    if (gateIndex + 1 < GATES.length) setGateIndex(gateIndex + 1);
    else setPhase('doctrine');
  }

  const allDoctrine = DOCTRINE.every((d) => doctrine[d.id]);
  const commitmentsAnswered = COMMITMENTS.every((c) => typeof commitments[c.id] === 'boolean');
  const walkDone = WALK.every((w) => (walk[w.id] ?? '').trim().length >= w.minChars);
  const scenariosDone = SCENARIOS.every(
    (s) => (scenarios[s.id] ?? '').trim().length >= s.minChars,
  );
  const guardianDone =
    isMinor === false ||
    (isMinor === true &&
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
        isMinor: isMinor === true,
        guardianName,
        guardianEmail,
        gates,
        doctrine,
        commitments,
        walk,
        scenarios,
      }).catch(() => ({ ok: false, error: 'Something went wrong. Please try again.' }));
      if (res.ok) setPhase('done');
      else setError(res.error ?? 'Could not send. Please try again.');
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

              {!allDoctrine && (
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  If one of these is something you are still working through, that is an honest
                  place to be, and it is worth a conversation rather than a checkbox. Say hello
                  through the FaithFlow form instead.
                </p>
              )}

              <button
                type="button"
                disabled={!allDoctrine}
                onClick={() => setPhase('about')}
                className="mt-6 w-full rounded-sm bg-gold px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
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
                <p className="text-sm text-ivory">Are you 18 or older?</p>
                <p className="mt-1 text-xs leading-relaxed text-silver">
                  Leaders under 18 serve here, always under a screened adult. It just means a
                  parent or guardian signs the covenant alongside you.
                </p>
                <div className="mt-4 flex gap-3">
                  {[
                    { label: '18 or older', minor: false },
                    { label: 'Under 18', minor: true },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setIsMinor(o.minor)}
                      aria-pressed={isMinor === o.minor}
                      className={cn(
                        'min-h-[44px] flex-1 rounded-sm border px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors',
                        isMinor === o.minor
                          ? 'border-gold/60 bg-gold/15 text-gold-lt'
                          : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {isMinor === true && (
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
                  </motion.div>
                )}
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
                {COMMITMENTS.map((c, i) => (
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
                    <YesNo
                      value={typeof commitments[c.id] === 'boolean' ? commitments[c.id] : null}
                      onChange={(v) => setCommitments((m) => ({ ...m, [c.id]: v }))}
                      idPrefix={c.id}
                    />
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
                        ? `a little more, please`
                        : 'thank you'}
                    </p>
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
                    <label htmlFor={s.id} className="mt-3 block text-sm font-medium leading-relaxed text-ivory">
                      {s.ask}
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
                        ? 'a little more, please'
                        : 'thank you'}
                    </p>
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
                Then this is not the season.
              </h2>
              <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-ivory-dim">
                That is not a judgment on you, and it is not a door closing. Leading a group here
                asks for those specific things, and answering honestly instead of telling us what
                we wanted to hear is exactly the character we would want in a leader anyway.
              </p>
              <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-silver">
                Come and be part of Iron and Ember. That is where leaders come from here, never
                from a form.
              </p>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
