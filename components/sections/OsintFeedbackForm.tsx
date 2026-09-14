'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { FloatingInput } from '@/components/motion/FloatingInput';
import { FloatingTextarea } from '@/components/motion/FloatingTextarea';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { cn } from '@/lib/utils';

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const MAX_MESSAGE_CHARS = 1500;
const RATE_LIMIT_MS = 10_000;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

const FOCUS_OPTIONS = [
  'First impression',
  'Workflow confusion',
  'Source review',
  'Safety concern',
  'Bug or broken state',
  'Feature request',
] as const;

function readField(formData: FormData, key: string, max: number) {
  return String(formData.get(key) || '').trim().slice(0, max);
}

export function OsintFeedbackForm() {
  const [message, setMessage] = useState('');
  const [focus, setFocus] = useState<(typeof FOCUS_OPTIONS)[number]>('First impression');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSubmitAt, setLastSubmitAt] = useState(0);

  const charsClass = message.length > MAX_MESSAGE_CHARS * 0.85 ? 'text-gold' : 'text-muted';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitAt < RATE_LIMIT_MS) {
      setErrorMsg('Please wait a moment before sending another note.');
      setState('error');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = readField(formData, 'name', 100);
    const email = readField(formData, 'email', 254);
    const discord = readField(formData, 'discord', 80);
    const build = readField(formData, 'build', 120);
    const syntheticOnly = formData.get('synthetic-only') === 'on';
    const botField = readField(formData, 'bot-field', 200);

    if (!name) {
      setErrorMsg('Please enter your name.');
      setState('error');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setErrorMsg('Please enter a valid email.');
      setState('error');
      return;
    }
    if (!syntheticOnly) {
      setErrorMsg('Please confirm this note contains only synthetic or demo material.');
      setState('error');
      return;
    }
    if (message.trim().length < 10) {
      setErrorMsg('Add a little more detail so the feedback is useful.');
      setState('error');
      return;
    }

    const packagedMessage = [
      `Discord: ${discord || '(not provided)'}`,
      `Build or demo reviewed: ${build || '(not provided)'}`,
      'Synthetic-only confirmation: yes',
      '',
      message.trim(),
    ].join('\n');

    setState('sending');
    setLastSubmitAt(now);
    setErrorMsg('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formName: 'osint-feedback',
          name,
          email,
          interest: focus,
          message: packagedMessage,
          botField,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrorMsg(
          typeof body?.error === 'string' && body.error
            ? body.error
            : 'Could not send right now. Please try again.',
        );
        setState('error');
        return;
      }

      form.reset();
      setMessage('');
      setFocus('First impression');
      setState('success');
    } catch {
      setErrorMsg('Could not send right now. Please try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-sm border border-border-gold bg-black-3 p-7 text-center md:p-9">
        <SuccessCheck size={70} className="mx-auto mb-5" />
        <h2 className="mb-3 font-display text-3xl font-light text-ivory">Received.</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-silver">
          Your feedback is headed to proverbs@christfields2717.com. You can keep quick back-and-forth
          in Discord; this form keeps the durable product notes in one place.
        </p>
        <Button
          type="button"
          variant="ghost"
          fx={false}
          onClick={() => setState('idle')}
          className="mt-6"
        >
          Send another note
        </Button>
      </div>
    );
  }

  return (
    <form id="feedback" onSubmit={onSubmit} className="rounded-sm border border-border-sub bg-black-3 p-6 md:p-8">
      <p hidden>
        <label>
          Do not fill this out:&nbsp;
          <input name="bot-field" />
        </label>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <FloatingInput name="name" label="Your name" type="text" required autoComplete="name" maxLength={100} />
        <FloatingInput name="email" label="Reply email" type="email" required autoComplete="email" maxLength={254} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FloatingInput name="discord" label="Discord name" type="text" autoComplete="off" maxLength={80} />
        <FloatingInput name="build" label="Build or demo link" type="text" autoComplete="off" maxLength={120} />
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-medium text-ivory">What kind of feedback is this?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {FOCUS_OPTIONS.map((option) => (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name="focus"
                value={option}
                checked={focus === option}
                onChange={() => setFocus(option)}
                className="peer sr-only"
              />
              <span className="flex min-h-11 items-center rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm leading-snug text-ivory-dim transition-colors duration-200 hover:border-gold/40 hover:text-ivory peer-checked:border-gold peer-checked:bg-gold/10 peer-checked:text-gold-lt peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
                {option}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <FloatingTextarea
          name="message"
          label="Feedback"
          hint="Keep this concrete: what happened, where you were in the workflow, and what you expected."
          rows={7}
          maxLength={MAX_MESSAGE_CHARS}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
        />
        <div aria-hidden className={cn('mt-1 text-right text-xs', charsClass)}>
          {message.length} / {MAX_MESSAGE_CHARS}
        </div>
      </div>

      <label className="mt-5 flex min-h-11 items-start gap-3 rounded-sm border border-border-sub bg-black-2 p-3 text-sm leading-relaxed text-silver transition-colors hover:border-border-gold hover:text-ivory-dim">
        <input
          name="synthetic-only"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-gold"
        />
        <span>
          This feedback contains only synthetic or demo material, not real case details, private records,
          screenshots, or active-investigation information.
        </span>
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          pending={state === 'sending'}
          pendingLabel="Sending..."
          disabled={state === 'sending'}
          className="min-w-[180px]"
        >
          Send feedback
        </Button>
        <p className="text-sm text-muted">
          Routed to proverbs@christfields2717.com.
        </p>
      </div>

      {state === 'error' && (
        <p className="mt-4 rounded-sm border border-danger/40 bg-danger-dk/30 px-4 py-3 text-sm text-danger-lt" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
