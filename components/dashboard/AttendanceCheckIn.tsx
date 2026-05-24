'use client';

import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  checkInThisWeek,
  getMyAttendance,
  type MyAttendanceWeek,
} from '@/app/dashboard/(app)/attendance/actions';

/**
 * The member's in-person touchpoint: a gentle weekly "I was there." A leader
 * confirms it. Showing up in person is the heartbeat of the group, so this sits
 * near the top of the dashboard — warm, never nagging.
 */
export function AttendanceCheckIn({ initial }: { initial: MyAttendanceWeek[] }) {
  const [weeks, setWeeks] = useState<MyAttendanceWeek[]>(initial);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  const current = weeks[0];
  const state: 'confirmed' | 'checked' | 'open' = current?.confirmed
    ? 'confirmed'
    : current?.checkedIn
      ? 'checked'
      : 'open';

  function check() {
    setNote(null);
    // Optimistic: flip this week to checked-in.
    setWeeks((w) => w.map((x, i) => (i === 0 ? { ...x, checkedIn: true } : x)));
    startTransition(async () => {
      const res = await checkInThisWeek();
      if (!res.ok) {
        setWeeks((w) => w.map((x, i) => (i === 0 ? { ...x, checkedIn: false } : x)));
        setNote(
          res.reason === 'no-group'
            ? 'Once you are part of a group, you can mark when you gather.'
            : 'Something went wrong. Try again in a moment.',
        );
        return;
      }
      const fresh = await getMyAttendance(weeks.length);
      if (fresh.length) setWeeks(fresh);
    });
  }

  return (
    <div className="relative overflow-hidden rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
      />
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        In person
      </p>

      {state === 'confirmed' && (
        <>
          <h3 className="font-display text-2xl font-light text-ivory">You were there.</h3>
          <p className="mt-2 text-sm leading-relaxed text-silver">
            Confirmed by your leader. Being present with your people is the truest part of this.
          </p>
        </>
      )}

      {state === 'checked' && (
        <>
          <h3 className="font-display text-2xl font-light text-ivory">Checked in.</h3>
          <p className="mt-2 text-sm leading-relaxed text-silver">
            Your leader will confirm it. Thank you for showing up.
          </p>
        </>
      )}

      {state === 'open' && (
        <>
          <h3 className="font-display text-2xl font-light text-ivory">Were you at group this week?</h3>
          <p className="mt-2 text-sm leading-relaxed text-silver">
            The gathering is the heart of this. If you were there, let your leader know.
          </p>
          <button
            type="button"
            onClick={check}
            disabled={pending}
            className={cn(
              'mt-4 inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors',
              pending ? 'cursor-not-allowed opacity-70' : 'hover:bg-gold-lt',
            )}
          >
            {pending ? 'Saving…' : 'I was there'}
          </button>
        </>
      )}

      {/* Recent weeks, oldest to newest. Quiet dots, no scores. */}
      <div className="mt-5 flex items-center gap-2">
        {weeks
          .slice()
          .reverse()
          .map((w) => (
            <span
              key={w.weekAnchor}
              title={w.confirmed ? 'Present' : w.checkedIn ? 'Checked in' : 'No gathering logged'}
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                w.confirmed
                  ? 'bg-emerald-lt'
                  : w.checkedIn
                    ? 'bg-gold/70 ring-1 ring-gold'
                    : 'bg-white/10',
              )}
            />
          ))}
        <span className="ml-2 text-[11px] text-muted">recent weeks</span>
      </div>

      {note && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-silver"
        >
          {note}
        </motion.p>
      )}
    </div>
  );
}
