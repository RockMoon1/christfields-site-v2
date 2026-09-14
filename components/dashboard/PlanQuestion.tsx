'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Notice } from '@/components/ui/Notice';
import { setPlan } from '@/app/dashboard/(app)/events/actions';

const OPTIONS: { key: string; label: string }[] = [
  { key: 'after_work', label: 'Right after work' },
  { key: 'hour_before', label: 'About an hour before' },
  { key: 'unsure', label: 'Not sure yet' },
];

/**
 * The one plan question, asked within a day of the event and never again.
 * Making a small plan measurably raises turnout; the answer is private to the
 * member and only ever echoed back to them.
 */
export function PlanQuestion({ eventId, initial }: { eventId: string; initial: string }) {
  const [plan, setPlanState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const restoreFocus = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (pending || !restoreFocus.current) return;
    const target = restoreFocus.current;
    restoreFocus.current = null;
    if (document.activeElement === document.body || document.activeElement === document.documentElement) target.focus();
  }, [pending]);

  function choose(key: string, target: HTMLButtonElement) {
    if (pending || inFlight.current) return;
    inFlight.current = true;
    const previous = plan;
    const next = previous === key ? '' : key;
    setError('');
    setPlanState(next);
    startTransition(async () => {
      const result = await setPlan(eventId, next).catch(() => ({ ok: false }));
      if (!result.ok) {
        setPlanState(previous);
        setError('Could not save your plan. Your answer has not changed. Please try again.');
      }
      restoreFocus.current = target;
      inFlight.current = false;
    });
  }

  return (
    <section className="rounded-sm border border-border-sub bg-black-3 p-5">
      <p className="text-base text-ivory">When will you head out?</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">Just for you. Nobody else sees this.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="When will you head out?" aria-busy={pending}>
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={plan === o.key}
            disabled={pending}
            onClick={(event) => choose(o.key, event.currentTarget)}
            className={cn(
              'inline-flex min-h-11 items-center rounded-sm border px-4 py-2 text-sm leading-relaxed transition-colors duration-200 disabled:cursor-wait',
              plan === o.key ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver hover:text-ivory',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Notice message={pending ? 'Saving your plan…' : error} tone={pending ? 'info' : 'problem'} className={pending || error ? 'mt-3' : undefined} />
    </section>
  );
}
