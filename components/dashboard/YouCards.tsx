'use client';

import { useId, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { setEmailReminders } from '@/app/dashboard/(app)/settings/actions';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';

/** The one email switch. */
export function EmailToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function toggle() {
    setError('');
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await setEmailReminders(next).catch(() => ({ ok: false }));
      if (!res.ok) {
        setOn(!next);
        setError('Could not save your email preference. Your previous setting is still in place. Please try again.');
      }
    });
  }

  return (
    <div><button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        'inline-flex min-h-[44px] items-center gap-3 rounded-sm border px-4 py-2 text-sm transition-colors duration-200 disabled:cursor-wait disabled:opacity-50',
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
    </button><Notice message={error} className="mt-3" /></div>
  );
}

/** Copy a link with one tap; falls back to a selectable field. */
export function CopyLink({ url, label = 'Copy my calendar link' }: { url: string; label?: string }) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState('');
  async function copy() {
    setError('');
    setCopying(true);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setError('Could not copy the link. Select the calendar link above and copy it.');
    } finally {
      setCopying(false);
    }
  }
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ivory">Calendar link</label>
      <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        id={id}
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 text-ivory-dim"
      />
      <Button fx={false} size="sm"
        onClick={copy}
        pending={copying} pendingLabel="Copying…"
      >
        {copied ? 'Copied' : label}
      </Button>
      </div>
      <Notice message={error || (copied ? 'Calendar link copied.' : '')} tone={error ? 'problem' : 'saved'} className="mt-3" />
    </div>
  );
}
