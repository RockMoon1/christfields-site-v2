'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
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
  const [, startTransition] = useTransition();

  return (
    <section className="rounded-sm border border-border-sub bg-black-3 p-5">
      <p className="text-base text-ivory">When will you head out?</p>
      <p className="mt-1 text-xs text-muted">Just for you. Nobody else sees this.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={plan === o.key}
            onClick={() => {
              const next = plan === o.key ? '' : o.key;
              setPlanState(next);
              startTransition(async () => {
                await setPlan(eventId, next).catch(() => undefined);
              });
            }}
            className={cn(
              'inline-flex min-h-[44px] items-center rounded-sm border px-4 text-sm transition-colors',
              plan === o.key ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver hover:text-ivory',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
