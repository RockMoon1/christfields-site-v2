'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { submitFeedback } from '@/app/dashboard/(app)/feedback/actions';
import { Button } from '@/components/Button';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';

const CATEGORIES = ['Idea', 'Something is confusing', 'Bug', 'Encouragement', 'Other'] as const;

/**
 * In-app feedback box. A member picks a category, writes a short note, and it is
 * emailed to the Christ Fields inbox. Compact and self-contained so it can live
 * in Settings without adding noise to the daily flow.
 */
export function FeedbackCard() {
  const fieldId = useId();
  const hasSent = useRef(false);
  const [category, setCategory] = useState<string>('Idea');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function send() {
    setError('');
    if (message.trim().length < 3) {
      setError('Add a little more detail first.');
      return;
    }
    startTransition(async () => {
      const res = await submitFeedback({ category, message: message.trim() }).catch(() => ({
        ok: false,
        error: 'Could not send right now. Please try again.',
      }));
      if (res.ok) {
        hasSent.current = true;
        setSent(true);
        setMessage('');
      } else {
        setError(res.error ?? 'Could not send right now.');
      }
    });
  }

  return (
    <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
      <p className="mb-2 text-meta font-medium uppercase tracking-[0.22em] text-gold">
        Help shape this
      </p>
      <h2 className="mb-3 font-display text-xl font-light text-ivory">
        Tell us what to build next
      </h2>
      <p className="mb-5 max-w-xl text-sm leading-relaxed text-silver">
        This is built for you and the people you walk with. If something is confusing, missing, or
        would help you grow, say so. It goes straight to Lisandro.
      </p>

      <p role="status" className="sr-only">{sent ? 'Feedback sent.' : ''}</p>
        {sent ? (
          <div
            className="rounded-sm border border-border-gold bg-gold/[0.06] p-5"
          >
            <p className="font-display text-lg font-light text-gold-lt">Thank you. We read every one.</p>
            <p className="mt-1 text-sm text-silver">
              Your note is on its way. It genuinely shapes what we build.
            </p>
            <Button fx={false} variant="ghost" size="sm" autoFocus
              onClick={() => setSent(false)}
              className="mt-4"
            >
              Send another
            </Button>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); send(); }}>
            {/* Category chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  disabled={pending}
                  aria-pressed={category === c}
                  className={cn(
                    'min-h-11 min-w-11 rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-wait disabled:opacity-50',
                    category === c
                      ? 'border-border-gold bg-gold/15 text-gold-lt'
                      : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <Field id={fieldId} label="Your feedback" error={error}>
            <Textarea
              autoFocus={hasSent.current}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would make this better for you?"
              rows={4}
              maxLength={2000}
              disabled={pending}
            />
            </Field>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button fx={false} size="sm"
                type="submit"
                pending={pending} pendingLabel="Sending…"
              >
                Send feedback
              </Button>
              <span className="text-sm text-muted">Goes straight to Lisandro.</span>
            </div>
          </form>
        )}
    </section>
  );
}
