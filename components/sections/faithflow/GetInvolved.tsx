'use client';

import { useState, type FormEvent } from 'react';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { cn } from '@/lib/utils';
import { FAITHFLOW_CONTENT, type InterestKey } from '@/lib/content/faithflow';
import { FloatingInput } from '../../motion/FloatingInput';
import { FloatingTextarea } from '../../motion/FloatingTextarea';
import { MagneticButton } from '../../motion/MagneticButton';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';
import { TailoredSuccess } from './TailoredSuccess';

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const MAX_MESSAGE_CHARS = 1000;
const RATE_LIMIT_MS = 10_000;

const INTEREST_OPTIONS: { value: InterestKey; label: string }[] = [
  { value: 'community', label: "I'm interested in FaithFlow community" },
  { value: 'future-group', label: "I'd like to be considered for a future group" },
  { value: 'help-start', label: "I'm interested in helping start a group" },
  { value: 'learn-more', label: 'I just want to learn more' },
];

export function GetInvolved() {
  const [message, setMessage] = useState('');
  const [interest, setInterest] = useState<InterestKey | ''>('');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSubmitAt, setLastSubmitAt] = useState(0);
  const [chosenInterest, setChosenInterest] = useState<InterestKey>('learn-more');

  const charsClass = message.length > MAX_MESSAGE_CHARS * 0.85 ? 'text-gold' : 'text-muted';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitAt < RATE_LIMIT_MS) {
      setErrorMsg('Please wait a moment before trying again.');
      setState('error');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const emailRe = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

    if (!name || name.length > 100) {
      setErrorMsg('Please enter your name.');
      setState('error');
      return;
    }
    if (!email || !emailRe.test(email) || email.length > 254) {
      setErrorMsg('Please enter a valid email.');
      setState('error');
      return;
    }
    if (!interest) {
      setErrorMsg('Please select an option from the dropdown.');
      setState('error');
      return;
    }

    setState('sending');
    setLastSubmitAt(now);

    try {
      // Send to our own API route, which emails the team and the person via
      // Resend. This does not rely on Netlify Forms intercepting the POST.
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formName: 'faithflow',
          name,
          email,
          interest,
          message: String(formData.get('message') || ''),
          botField: String(formData.get('bot-field') || ''),
        }),
      });
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      setChosenInterest(interest as InterestKey);
      setState('success');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
    }
  }

  return (
    <section
      id="get-involved"
      className="relative z-[2] overflow-hidden py-[110px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(201, 165, 72, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 100%, rgba(45, 106, 79, 0.10) 0%, transparent 60%)
          `,
        }}
      />

      <Container className="text-center">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Get Involved
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            Ready to Walk <em className="not-italic text-gold-lt">Together?</em>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            Whether you are interested in FaithFlow community, future groups, helping start a
            group, or simply learning more, we would love to hear from you.
          </p>
        </Reveal>

        {state === 'success' ? (
          <Reveal>
            <div className="mx-auto max-w-2xl rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-10 text-center">
              <ScriptureSymbol className="mb-4 block text-3xl text-gold" />
              <h3 className="mb-4 font-display text-4xl font-light text-ivory">Thank You.</h3>
              <p className="mb-6 leading-relaxed text-ivory-dim">
                Your message has been received. We will review it and reach out when there is a
                fitting next step.
              </p>

              <TailoredSuccess content={FAITHFLOW_CONTENT[chosenInterest]} />

              <a
                href="#what"
                className="mt-8 inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-5 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                &larr; Back to FaithFlow
              </a>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.15}>
            <form onSubmit={onSubmit} className="mx-auto max-w-2xl text-left">
              {/* Honeypot. Real people leave this blank; bots tend to fill it,
                  and our /api/submit route silently drops anything that does. */}
              <p hidden>
                <label>
                  Do not fill this out:&nbsp;
                  <input name="bot-field" />
                </label>
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <FloatingInput name="name" label="Your name" type="text" required autoComplete="given-name" maxLength={100} />
                <FloatingInput name="email" label="Your email address" type="email" required autoComplete="email" maxLength={254} />
              </div>

              <div className="mt-4">
                <select
                  name="interest"
                  required
                  aria-label="What brings you here?"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value as InterestKey)}
                  className="w-full rounded-sm border border-border-sub bg-black-3 px-4 py-3 text-sm text-ivory focus:border-gold focus:outline-none"
                >
                  <option value="" disabled>
                    What brings you here?
                  </option>
                  {INTEREST_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <FloatingTextarea
                  name="message"
                  label="Tell us about yourself"
                  hint="Your faith journey, what brings you here, or what you are looking for. We read every message."
                  rows={5}
                  maxLength={MAX_MESSAGE_CHARS}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className={cn('mt-1 text-right text-xs', charsClass)}>
                  {message.length} / {MAX_MESSAGE_CHARS}
                </div>
              </div>

              <button
                type="submit"
                disabled={state === 'sending'}
                className={cn(
                  'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-6 py-4 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors',
                  state !== 'sending' && 'hover:bg-gold-lt',
                  state === 'sending' && 'cursor-not-allowed opacity-70',
                )}
              >
                {state === 'sending' ? 'Sending...' : <>Get In Touch &rarr;</>}
              </button>

              {state === 'error' && (
                <p className="mt-3 text-center text-sm text-red-400" role="alert">
                  {errorMsg}
                </p>
              )}

              <p className="mt-6 text-center text-xs text-muted">
                No spam. Real responses from proverbs@christfields2717.com
              </p>
            </form>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
