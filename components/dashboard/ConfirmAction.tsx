'use client';

import { useState } from 'react';

/**
 * A destructive control that asks once before it acts.
 *
 * Deleting things here is permanent and there is no undo, so a single stray
 * tap should never be enough. The confirm state replaces the trigger in place
 * rather than opening a dialog, which keeps the page calm and works the same
 * on a phone.
 */
export function ConfirmAction({
  onConfirm,
  label,
  confirmLabel = 'Delete',
  cancelLabel = 'Keep',
  children,
  className = '',
}: {
  onConfirm: () => void;
  /** Accessible name for the trigger, e.g. "Remove event". */
  label: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** The trigger's visible content (usually an icon). */
  children: React.ReactNode;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex shrink-0 items-center gap-2 text-[10px]">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="rounded-sm border border-gold/40 px-2 py-1 uppercase tracking-[0.1em] text-gold transition-colors hover:bg-gold hover:text-black"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-sm border border-border-sub px-2 py-1 uppercase tracking-[0.1em] text-silver transition-colors hover:text-ivory"
        >
          {cancelLabel}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={label}
      className={className}
    >
      {children}
    </button>
  );
}
