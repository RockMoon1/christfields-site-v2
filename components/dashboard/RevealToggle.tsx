'use client';

import { useTransition } from 'react';
import { setRevealAll } from '@/app/dashboard/(app)/prefs/actions';
import { cn } from '@/lib/utils';

/**
 * The always-available "show me everything" control. Flips the member's
 * reveal_all preference so nothing is ever gated against a curious person.
 * Reveal-by-default, never a locked door.
 */
export function RevealToggle({ revealAll }: { revealAll: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await setRevealAll(!revealAll);
          } catch {
            // Non-critical: the preference just will not persist this time.
          }
        })
      }
      className={cn(
        'flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-xs transition-colors',
        'text-muted hover:text-silver',
        pending && 'opacity-60',
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        <EyeIcon open={!revealAll} />
      </span>
      {revealAll ? 'Show less' : 'Show me everything'}
    </button>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.1" />
      {!open && <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />}
    </svg>
  );
}
