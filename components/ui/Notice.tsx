import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  problem: 'border-danger/45 bg-danger-dk/30 text-danger-lt',
  saved: 'border-gold/35 bg-gold/[0.07] text-ivory-dim',
  info: 'border-border-sub bg-black-3 text-ivory-dim',
};

/** Keep the live region mounted before an async message arrives. Routine
 * failures stay polite so they do not interrupt speech already in progress. */
export function Notice({ message, tone = 'problem', className }: {
  message?: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return <div aria-live="polite" aria-atomic="true" className={className}>
    {message && <p className={cn('rounded-sm border px-3 py-2 text-sm leading-relaxed', tones[tone])}>{message}</p>}
  </div>;
}
