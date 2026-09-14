'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';
import type { MemberSlot } from '@/lib/schedule/public-event';
import { claimSlot, unclaimSlot, offerRide } from '@/app/dashboard/(app)/events/actions';

/**
 * Bring-something and rides, as claimable slots. Taken slots are visibly taken
 * so nobody brings a second salad; a driver can offer seats and riders claim
 * them. Only renders when the leader turned these on for the event.
 */
export function SlotList({ eventId, slots, ridesEnabled }: { eventId: string; slots: MemberSlot[]; ridesEnabled: boolean }) {
  const bring = slots.filter((s) => s.kind === 'bring');
  const rides = slots.filter((s) => s.kind === 'ride');
  if (bring.length === 0 && !ridesEnabled && rides.length === 0) return null;

  return (
    <div className="space-y-6">
      {bring.length > 0 && (
        <section>
          <p className="mb-3 text-meta font-medium uppercase tracking-[0.2em] text-gold">Bring something</p>
          <ul className="space-y-2">
            {bring.map((s) => (
              <SlotRow key={s.id} slot={s} />
            ))}
          </ul>
        </section>
      )}
      {(ridesEnabled || rides.length > 0) && (
        <section>
          <p className="mb-3 text-meta font-medium uppercase tracking-[0.2em] text-gold">Rides</p>
          {rides.length === 0 && <p className="mb-2 text-sm text-muted">Nobody has offered a ride yet.</p>}
          <ul className="space-y-2">
            {rides.map((s) => (
              <SlotRow key={s.id} slot={s} seatLabel />
            ))}
          </ul>
          {ridesEnabled && <OfferRide eventId={eventId} />}
        </section>
      )}
    </div>
  );
}

function SlotRow({ slot, seatLabel = false }: { slot: MemberSlot; seatLabel?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const actionRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const labelId = useId();
  const mine = slot.claims.some((c) => c.mine);
  const full = slot.taken >= slot.capacity;
  const others = slot.claims.filter((c) => !c.mine).map((c) => c.displayName || 'Someone');

  useEffect(() => {
    if (pending || !restoreFocus.current) return;
    restoreFocus.current = false;
    if (document.activeElement === document.body || document.activeElement === document.documentElement) actionRef.current?.focus();
  }, [pending]);

  function toggle() {
    if (pending || inFlight.current || (!mine && full)) return;
    inFlight.current = true;
    setError('');
    startTransition(async () => {
      const res: { ok: boolean; error?: string } = await (mine ? unclaimSlot(slot.id) : claimSlot(slot.id, 1)).catch(() => ({ ok: false }));
      if (!res.ok) setError(res.error || 'Could not save that.');
      router.refresh();
      restoreFocus.current = true;
      inFlight.current = false;
    });
  }

  return (
    <li className="rounded-sm border border-border-sub bg-black-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <p id={labelId} className="text-base leading-relaxed text-ivory">{slot.label}</p>
          <p id={`${labelId}-status`} className="mt-1 text-sm leading-relaxed text-muted">
            {mine ? (seatLabel ? 'You have a seat' : 'You are bringing this') : others.length > 0 ? `${others.join(', ')}${seatLabel ? ' riding' : ''}` : seatLabel ? `${slot.capacity - slot.taken} open` : 'Nobody yet'}
            {seatLabel && !mine && others.length > 0 && slot.capacity > slot.taken ? `, ${slot.capacity - slot.taken} open` : ''}
          </p>
        </div>
        <Button
          ref={actionRef}
          fx={false}
          variant={mine || full ? 'quiet' : 'ghost'}
          size="sm"
          onClick={toggle}
          pending={pending}
          disabled={!mine && full}
          aria-pressed={mine}
          aria-describedby={`${labelId} ${labelId}-status`}
          className={cn('w-full shrink-0 sm:w-auto', mine && 'border-border-gold bg-gold/15 text-gold-lt')}
        >
          {mine ? 'Undo' : full ? 'Taken' : seatLabel ? 'I need a seat' : 'I will bring it'}
        </Button>
      </div>
      <Notice message={error} className={error ? 'mt-3' : undefined} />
    </li>
  );
}

function OfferRide({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seats, setSeats] = useState(2);
  const [from, setFrom] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const focusRequest = useRef<'from' | 'trigger' | 'submit' | null>(null);
  const fromId = useId();

  // Changing this inline form removes the initiating control. Restore only
  // unclaimed focus so a delayed response cannot interrupt another task.
  useEffect(() => {
    if (pending || !focusRequest.current) return;
    const target = focusRequest.current;
    focusRequest.current = null;
    const active = document.activeElement;
    if (active === document.body || active === document.documentElement) {
      (target === 'from' ? fromRef : target === 'trigger' ? triggerRef : submitRef).current?.focus();
    }
  }, [open, pending]);

  function showForm() {
    setError('');
    focusRequest.current = 'from';
    setOpen(true);
  }

  function closeForm() {
    if (pending || inFlight.current) return;
    setError('');
    focusRequest.current = 'trigger';
    setOpen(false);
  }

  function save() {
    if (pending || inFlight.current) return;
    inFlight.current = true;
    setError('');
    startTransition(async () => {
      const result: { ok: boolean; error?: string } = await offerRide(eventId, seats, from).catch(() => ({ ok: false }));
      if (result.ok) {
        focusRequest.current = 'trigger';
        setOpen(false);
        setSeats(2);
        setFrom('');
        router.refresh();
      } else {
        setError(result.error || 'Could not add your ride. Your details are still here. Please try again.');
        focusRequest.current = 'submit';
      }
      inFlight.current = false;
    });
  }

  return (
    <div className="mt-3">
      {open ? (
        <form onSubmit={(event) => { event.preventDefault(); save(); }} className="rounded-sm border border-border-sub bg-black-3 p-4">
          <fieldset disabled={pending}>
            <legend className="mb-3 text-base text-ivory">How many seats?</legend>
            <div className="mb-4 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} ${n === 1 ? 'seat' : 'seats'}`}
                  aria-pressed={seats === n}
                  onClick={() => setSeats(n)}
                  className={cn(
                    'min-h-11 min-w-11 rounded-sm border px-3 py-2 text-sm transition-colors duration-200 disabled:cursor-wait',
                    seats === n ? 'border-border-gold bg-gold/20 text-gold-lt' : 'border-border-sub text-silver hover:border-gold/40 hover:text-ivory',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          <Field id={fromId} label="Leaving from (optional)">
            <Input
              ref={fromRef}
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={pending}
              maxLength={60}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button ref={submitRef} type="submit" fx={false} size="sm" pending={pending} pendingLabel="Offering seats…">
              Offer seats
            </Button>
            <Button fx={false} variant="quiet" size="sm" disabled={pending} onClick={closeForm}>
              Never mind
            </Button>
          </div>
        </form>
      ) : (
        <Button ref={triggerRef} fx={false} variant="quiet" size="sm" onClick={showForm}>I can drive</Button>
      )}
      <Notice message={error} className={error ? 'mt-3' : undefined} />
    </div>
  );
}
