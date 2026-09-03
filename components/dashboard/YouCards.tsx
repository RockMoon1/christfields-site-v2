'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { setEmailReminders } from '@/app/dashboard/(app)/settings/actions';

/** The one email switch. */
export function EmailToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await setEmailReminders(next).catch(() => ({ ok: false }));
      if (!res.ok) setOn(!next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      className={cn(
        'inline-flex min-h-[44px] items-center gap-3 rounded-sm border px-4 text-sm transition-colors',
        on ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
      )}
    >
      <span
        aria-hidden
        className={cn('relative inline-block h-5 w-9 rounded-full transition-colors', on ? 'bg-gold' : 'bg-black-4')}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform',
            on ? 'left-4' : 'left-0.5',
          )}
        />
      </span>
      {on ? 'Emails are on' : 'Emails are off'}
    </button>
  );
}

/** Copy a link with one tap; falls back to a selectable field. */
export function CopyLink({ url, label = 'Copy my calendar link' }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-h-[44px] flex-1 rounded-sm border border-border-sub bg-black-2 px-3 text-sm text-ivory-dim focus:border-gold focus:outline-none"
      />
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
      >
        {copied ? 'Copied' : label}
      </button>
    </div>
  );
}
