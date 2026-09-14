'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Notice } from '@/components/ui/Notice';

/**
 * An inline confirmation for permanent actions. Focus enters on Keep, returns
 * to the trigger on dismissal, and stays in place on failure. onConfirm must
 * resolve only after success and reject on failure so retries remain possible.
 */
export function ConfirmAction({
  onConfirm,
  label,
  confirmLabel = 'Delete',
  cancelLabel = 'Keep',
  pendingLabel = 'Deleting…',
  errorMessage = 'Could not delete that. Please try again.',
  disabled = false,
  children,
  className = '',
}: {
  onConfirm: () => void | Promise<void>;
  /** Accessible name for the trigger, e.g. "Delete reflection". */
  label: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  errorMessage?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (restoreFocus.current) {
      triggerRef.current?.focus();
      restoreFocus.current = false;
    }
  }, [confirming]);

  useEffect(() => {
    if (error && !pending) confirmRef.current?.focus();
  }, [error, pending]);

  function dismiss() {
    if (inFlight.current) return;
    restoreFocus.current = true;
    setError(null);
    setConfirming(false);
  }

  async function confirm() {
    if (inFlight.current || disabled) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      restoreFocus.current = true;
      setConfirming(false);
    } catch {
      setError(errorMessage);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div
      className="inline-flex max-w-full flex-col items-start gap-2 align-middle"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && confirming && !inFlight.current) {
          event.preventDefault();
          event.stopPropagation();
          dismiss();
        }
      }}
    >
      {confirming ? (
        <div role="group" aria-label={`Confirm: ${label}`} className="flex flex-wrap items-center gap-2">
          <Button
            ref={confirmRef}
            fx={false}
            variant="danger"
            size="sm"
            pending={pending}
            pendingLabel={pendingLabel}
            disabled={disabled}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
          <Button ref={cancelRef} fx={false} variant="quiet" size="sm" disabled={pending} onClick={dismiss}>
            {cancelLabel}
          </Button>
        </div>
      ) : (
        <Button
          ref={triggerRef}
          fx={false}
          variant="quiet"
          size="sm"
          disabled={disabled}
          onClick={() => { setError(null); setConfirming(true); }}
          aria-label={label}
          className={className}
        >
          {children}
        </Button>
      )}
      <Notice message={error} />
    </div>
  );
}
