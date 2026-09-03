'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
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
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Bring something</p>
          <ul className="space-y-2">
            {bring.map((s) => (
              <SlotRow key={s.id} slot={s} />
            ))}
          </ul>
        </section>
      )}
      {(ridesEnabled || rides.length > 0) && (
        <section>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Rides</p>
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
  const mine = slot.claims.some((c) => c.mine);
  const full = slot.taken >= slot.capacity;
  const others = slot.claims.filter((c) => !c.mine).map((c) => c.displayName || 'Someone');

  function toggle() {
    setError('');
    startTransition(async () => {
      const res: { ok: boolean; error?: string } = mine ? await unclaimSlot(slot.id) : await claimSlot(slot.id, 1);
      if (!res.ok) setError(res.error || 'Could not save that.');
      router.refresh();
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-sm border border-border-sub bg-black-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-ivory">{slot.label}</p>
        <p className="text-xs text-muted">
          {mine ? (seatLabel ? 'You have a seat' : 'You are bringing this') : others.length > 0 ? `${others.join(', ')}${seatLabel ? ' riding' : ''}` : seatLabel ? `${slot.capacity - slot.taken} open` : 'Nobody yet'}
          {seatLabel && !mine && others.length > 0 && slot.capacity > slot.taken ? `, ${slot.capacity - slot.taken} open` : ''}
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending || (!mine && full)}
        className={cn(
          'inline-flex min-h-[44px] shrink-0 items-center rounded-sm border px-4 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors',
          mine
            ? 'border-border-gold bg-gold/15 text-gold-lt'
            : full
              ? 'border-border-sub text-muted'
              : 'border-gold/45 text-gold hover:bg-gold hover:text-black',
        )}
      >
        {mine ? 'Undo' : full ? 'Taken' : seatLabel ? 'I need a seat' : 'I will bring it'}
      </button>
    </li>
  );
}

function OfferRide({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seats, setSeats] = useState(2);
  const [from, setFrom] = useState('');
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-silver hover:border-ivory/40 hover:text-ivory"
      >
        I can drive
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-sm border border-border-sub bg-black-3 p-4">
      <p className="mb-3 text-sm text-ivory">How many seats?</p>
      <div className="mb-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSeats(n)}
            className={cn(
              'h-11 w-11 rounded-sm border text-sm',
              seats === n ? 'border-border-gold bg-gold/20 text-gold-lt' : 'border-border-sub text-silver',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        placeholder="Leaving from (optional)"
        maxLength={60}
        className="mb-3 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-3 text-base text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await offerRide(eventId, seats, from);
              setOpen(false);
              router.refresh();
            })
          }
          className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt disabled:opacity-60"
        >
          Offer seats
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
          Never mind
        </button>
      </div>
    </div>
  );
}
