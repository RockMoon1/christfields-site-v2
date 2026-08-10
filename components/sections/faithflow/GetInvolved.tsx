'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '../../Button';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/utils';
import { FAITHFLOW_CONTENT, type InterestKey } from '@/lib/content/faithflow';
import { FloatingInput } from '../../motion/FloatingInput';
import { FloatingTextarea } from '../../motion/FloatingTextarea';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';
import { TailoredSuccess } from './TailoredSuccess';

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const MAX_MESSAGE_CHARS = 1000;
const RATE_LIMIT_MS = 10_000;

const INTEREST_OPTIONS: { value: InterestKey; label: string }[] = [
  { value: 'community', label: "I'm interested in FaithFlow community" },
  { value: 'future-group', label: "I'd like to be considered for Iron and Ember" },
  { value: 'help-start', label: "I'm interested in leading a small group" },
  { value: 'learn-more', label: 'I just want to learn more' },
];

/**
 * The Get Involved form. The old native select (default OS chrome between
 * premium floating-label fields) is now an accessible radio chip group —
 * native radio inputs kept for keyboard arrow-key navigation and screen
 * readers, styled as selectable gold chips with 44px touch targets. The
 * submit is the shared Button with an ember burst on commit. All form
 * handling (validation, honeypot, rate limit, /api/submit) is unchanged.
 */
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
      setErrorMsg('Please select what brings you here.');
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
        // Surface the server's own message (e.g. the 429 "please wait a
        // moment") instead of a generic error that invites an instant retry.
        // Handled inline, NOT thrown: the catch below must stay generic so a
        // network failure never leaks a raw browser string like
        // "Failed to fetch" into the UI.
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrorMsg(
          typeof body?.error === 'string' && body.error
            ? body.error
            : 'Something went wrong. Please try again.',
        );
        setState('error');
        return;
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
        <SectionHeader
          eyebrow="Get Involved"
          title={
            <>
              Ready to Walk <em className="not-italic text-gold-lt">Together?</em>
            </>
          }
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
          lede="Whether you are interested in joining Iron and Ember, leading a small group within it, or simply learning more, we would love to hear from you."
          ledeClassName="text-silver"
          className="mb-12"
        />

        {state === 'success' ? (
          <Reveal variant="clip">
            <div className="cf-glass mx-auto max-w-2xl rounded-sm p-10 text-center">
              <ScriptureSymbol className="mb-4 block text-3xl text-gold" />
              <h3 className="mb-4 font-display text-4xl font-light text-ivory">Thank You.</h3>
              <p className="mb-6 leading-relaxed text-ivory-dim">
                Your message has been received. We will review it and reach out when there is a
                fitting next step.
              </p>

              <TailoredSuccess content={FAITHFLOW_CONTENT[chosenInterest]} />

              <div className="mt-8 flex justify-center">
                <Button href="#what" variant="ghost">
                  &larr; Back to FaithFlow
                </Button>
              </div>
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

              <fieldset className="mt-6">
                <legend className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-silver">
                  What brings you here?
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INTEREST_OPTIONS.map((opt) => (
                    <label key={opt.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="interest"
                        value={opt.value}
                        checked={interest === opt.value}
                        onChange={() => setInterest(opt.value)}
                        className="peer sr-only"
                      />
                      <span className="flex min-h-[44px] items-center rounded-sm border border-border-sub bg-black-3 px-4 py-3 text-sm leading-snug text-ivory-dim transition-colors duration-200 hover:border-gold/40 hover:text-ivory peer-checked:border-gold peer-checked:bg-gold/10 peer-checked:text-gold-lt peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

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
                <div aria-hidden className={cn('mt-1 text-right text-xs', charsClass)}>
                  {message.length} / {MAX_MESSAGE_CHARS}
                </div>
                {message.length > MAX_MESSAGE_CHARS * 0.85 && (
                  <span role="status" className="sr-only">
                    {MAX_MESSAGE_CHARS - message.length} characters left
                  </span>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  type="submit"
                  emberBurst
                  disabled={state === 'sending'}
                  className="min-w-[260px] py-4"
                >
                  {state === 'sending' ? 'Sending...' : <>Get In Touch &rarr;</>}
                </Button>
              </div>

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
