'use client';

import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { Button } from '../Button';
import { cn } from '@/lib/utils';
import { FloatingInput } from '../motion/FloatingInput';
import { FloatingTextarea } from '../motion/FloatingTextarea';
import { ScriptureSymbol } from '../motion/ScriptureSymbol';
import { SuccessCheck } from '../motion/SuccessCheck';
import { TextSplit } from '../motion/TextSplit';
import { MorphBlob } from '../motion/MorphBlob';

/**
 * The page's one conversion point. The form keeps its floating-label fields,
 * honeypot, soft rate limit, and live character counter; submission happens
 * through the shared Button with an ember burst (fire as a response to
 * commitment, not wallpaper). The form-to-success swap is choreographed with
 * AnimatePresence: the form slides out, the success card settles in, the
 * check draws itself, and Proverbs 16:3 arrives word by word at reading pace.
 *
 * The #join anchor lives on the wrapper div in app/page.tsx, so this section
 * deliberately carries no id of its own.
 */

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const MAX_MESSAGE_CHARS = 1000;
const RATE_LIMIT_MS = 10_000;

const EASE = [0.22, 1, 0.36, 1] as const;

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
    <section className="relative overflow-hidden py-[110px]">
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
        <SectionHeader
          eyebrow="Join the journey"
          title={
            <>
              Walk with<br />
              <em className="not-italic text-gold-lt">us.</em>
            </>
          }
          lede="GraceFlow and LearnFlow are live now, with more tools on the way, alongside our in-person community. Leave your email and we will keep you close: new tools as they open, FaithFlow news, and the occasional note worth reading."
          className="mb-12"
          ledeClassName="text-silver"
        />

        <Reveal delay={0.15}>
          <AnimatePresence mode="wait" initial={false}>
            {state === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.65, ease: EASE }}
              >
                <div className="mx-auto max-w-xl rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-10 text-center">
                  <SuccessCheck size={72} className="mx-auto mb-5" />
                  <ScriptureSymbol className="mb-4 block text-3xl text-gold" />
                  <h3 className="mb-4 font-display text-3xl font-light text-ivory">You&rsquo;re in.</h3>
                  <p className="mb-3 leading-relaxed text-ivory-dim">
                    Welcome to the journey. We will reach out at launch and along the way.
                  </p>
                  <p className="font-display italic text-silver">
                    <TextSplit
                      by="word"
                      mask
                      delay={0.6}
                      text={'“Commit your work to the Lord, and your plans will be established.” Proverbs 16:3'}
                    />
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
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
                    <Select name="interest" defaultValue="" aria-label="What are you most interested in?">
                      <option value="" disabled>What are you most interested in?</option>
                      <option value="scholarflow">ScholarFlow, our faith and study apps</option>
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
                    <div aria-hidden className={cn('mt-1 text-right text-xs', charsClass)}>
                      {message.length} / {MAX_MESSAGE_CHARS}
                    </div>
                    {message.length > MAX_MESSAGE_CHARS * 0.85 && (
                      <span role="status" className="sr-only">
                        {MAX_MESSAGE_CHARS - message.length} characters left
                      </span>
                    )}
                  </div>

                  {/* The commitment moment: the one ember burst on the page. */}
                  <div className="mt-6 text-center">
                    <Button
                      type="submit"
                      emberBurst
                      disabled={state === 'sending'}
                      className="px-12 py-4"
                    >
                      {state === 'sending' ? 'Sending...' : <>Join the Journey &rarr;</>}
                    </Button>
                  </div>

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
              </motion.div>
            )}
          </AnimatePresence>
        </Reveal>
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
