'use client';

import { useState, type FormEvent } from 'react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { cn } from '@/lib/utils';
import { FloatingInput } from '../motion/FloatingInput';
import { FloatingTextarea } from '../motion/FloatingTextarea';
import { ScriptureSymbol } from '../motion/ScriptureSymbol';
import { SuccessCheck } from '../motion/SuccessCheck';
import { MorphBlob } from '../motion/MorphBlob';

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const MAX_MESSAGE_CHARS = 1000;
const RATE_LIMIT_MS = 10_000;

export function JoinForm() {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSubmitAt, setLastSubmitAt] = useState(0);

  const charsClass = message.length > MAX_MESSAGE_CHARS * 0.85
    ? 'text-gold'
    : 'text-muted';

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

    setState('sending');
    setLastSubmitAt(now);

    try {
      // Send to our own API route, which emails the team and the person via
      // Resend. This does not rely on Netlify Forms intercepting the POST,
      // which is unreliable inside the Next.js runtime.
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formName: 'waitlist',
          name,
          email,
          interest: String(formData.get('interest') || ''),
          message: String(formData.get('message') || ''),
          botField: String(formData.get('bot-field') || ''),
        }),
      });
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      setState('success');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
    }
  }

  return (
    <section
      id="join"
      className="relative overflow-hidden py-[110px]"
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

      {/* Ambient morphing blobs for depth, matching Vision section */}
      <MorphBlob color="rgba(201, 165, 72, 0.05)" size={550} className="-left-32 top-20" />
      <MorphBlob color="rgba(45, 106, 79, 0.07)" size={500} className="-bottom-24 -right-28" />

      <Container className="text-center">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Early Access
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            Get Early Access to<br />
            <em className="not-italic text-gold-lt">ScholarFlow.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            ScholarFlow is coming. Sign up now to be first in line. Get notified at launch, help shape
            what we build, and join a community of students serious about building real discipline.
          </p>
        </Reveal>

        {state === 'success' ? (
          <Reveal>
            <div className="mx-auto max-w-xl rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-10 text-center">
              <SuccessCheck size={72} className="mx-auto mb-5" />
              <ScriptureSymbol className="mb-4 block text-3xl text-gold" />
              <h3 className="mb-4 font-display text-3xl font-light text-ivory">You&rsquo;re in.</h3>
              <p className="mb-3 leading-relaxed text-ivory-dim">
                Welcome to the journey. We will reach out at launch and along the way.
              </p>
              <p className="font-display italic text-silver">
                &ldquo;Commit your work to the Lord, and your plans will be established.&rdquo; Proverbs 16:3
              </p>
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
                <Select name="interest" defaultValue="">
                  <option value="" disabled>What are you most interested in?</option>
                  <option value="scholarflow">ScholarFlow, Productivity and Discipline App</option>
                  <option value="faithflow">FaithFlow, Weekly Small Groups and Community</option>
                  <option value="osint">OSINT and Trace, Cybersecurity for Good</option>
                  <option value="all">Everything. I want to follow the whole journey</option>
                </Select>
              </div>

              <div className="mt-4">
                <FloatingTextarea
                  name="message"
                  label="Tell us about yourself"
                  hint="Introduce yourself, ask a question, share what brought you here. We read every message."
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
                {state === 'sending' ? 'Sending...' : <>Join the Journey &rarr;</>}
              </button>

              {state === 'error' && (
                <p className="mt-3 text-center text-sm text-red-400" role="alert">
                  {errorMsg}
                </p>
              )}

              <p className="mt-6 text-center text-xs text-muted">
                No spam. Just real updates, early access, and community invites from
                proverbs@christfields2717.com
              </p>
            </form>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

/* ============================================================
   Select primitive (the only one still used. Inputs and textarea
   are now handled by FloatingInput / FloatingTextarea.)
   ============================================================ */

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      required
      {...props}
      className="w-full rounded-sm border border-border-sub bg-black-3 px-4 py-3 text-sm text-ivory focus:border-gold focus:outline-none"
    />
  );
}
