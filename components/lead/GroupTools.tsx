'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markEveryoneKnown } from '@/app/dashboard/(app)/lead/actions';

/**
 * Two small tools for a leader: the invite text to send from their own phone
 * (the only SMS this app will ever use), and the one-time "everyone here is
 * known" switch that keeps existing members from ever being flagged as new.
 */
export function GroupTools({
  orgId,
  inviteText,
  knownCount,
  total,
}: {
  orgId: string;
  inviteText: string;
  knownCount: number;
  total: number;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-sm border border-border-sub bg-black-3 p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Invite text</p>
        <p className="mt-2 text-sm leading-relaxed text-silver">
          Invite people by email below, then text them this from your own phone so it arrives from someone they trust.
        </p>
        <p className="mt-3 rounded-sm border border-border-sub bg-black-2 p-3 text-sm text-ivory-dim">{inviteText}</p>
        <button
          type="button"
          onClick={copy}
          className="mt-3 inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black"
        >
          {copied ? 'Copied' : 'Copy the text'}
        </button>
      </div>

      <div className="rounded-sm border border-border-sub bg-black-3 p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Who is new</p>
        <p className="mt-2 text-sm leading-relaxed text-silver">
          When someone new says they are in for the first time, you will see it. Tap once so everyone already here is
          not counted as new. {knownCount} of {total} marked so far.
        </p>
        <button
          type="button"
          disabled={pending || knownCount >= total}
          onClick={() =>
            startTransition(async () => {
              await markEveryoneKnown(orgId);
              router.refresh();
            })
          }
          className="mt-3 inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-silver hover:border-ivory/40 hover:text-ivory disabled:opacity-60"
        >
          {knownCount >= total ? 'Everyone is marked' : 'Everyone here is known'}
        </button>
      </div>
    </section>
  );
}
