'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { submitFeedback } from '@/app/dashboard/(app)/feedback/actions';

const CATEGORIES = ['Idea', 'Something is confusing', 'Bug', 'Encouragement', 'Other'] as const;

/**
 * In-app feedback box. A member picks a category, writes a short note, and it is
 * emailed to the Christ Fields inbox. Compact and self-contained so it can live
 * in Settings without adding noise to the daily flow.
 */
export function FeedbackCard() {
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
        setSent(true);
        setMessage('');
      } else {
        setError(res.error ?? 'Could not send right now.');
      }
    });
  }

  return (
    <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        Help shape this
      </p>
      <h3 className="mb-3 font-display text-xl font-light text-ivory">
        Tell us what to build next
      </h3>
      <p className="mb-5 max-w-xl text-sm leading-relaxed text-silver">
        This is built for you and the people you walk with. If something is confusing, missing, or
        would help you grow, say so. It goes straight to Lisandro.
      </p>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border border-border-gold bg-gold/[0.06] p-5"
          >
            <p className="font-display text-lg font-light text-gold-lt">Thank you. We read every one.</p>
            <p className="mt-1 text-sm text-silver">
              Your note is on its way. It genuinely shapes what we build.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-gold transition-colors hover:text-gold-lt"
            >
              Send another
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Category chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                    category === c
                      ? 'border-border-gold bg-gold/15 text-gold-lt'
                      : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would make this better for you?"
              rows={4}
              maxLength={2000}
              className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
            />

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={send}
                disabled={pending}
                className="rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-gold-lt disabled:opacity-60"
              >
                {pending ? 'Sending…' : 'Send feedback'}
              </button>
              <span className="text-xs text-muted">Goes straight to Lisandro.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
