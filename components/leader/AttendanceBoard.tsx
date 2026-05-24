'use client';

import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getAttendanceBoard, setMemberAttendance } from '@/app/dashboard/(leader)/leader/actions';
import type { AttendanceBoardResult, AttendanceMemberRow } from '@/lib/faithflow/types';

type ReadyBoard = Extract<AttendanceBoardResult, { state: 'ready' }>;

function weekShort(anchor: string): string {
  return new Date(`${anchor}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border-gold"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-[13px] font-medium text-black">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function AttendanceBoard({ initial }: { initial: ReadyBoard }) {
  const [board, setBoard] = useState<ReadyBoard>(initial);
  const [pending, startTransition] = useTransition();

  const thisWeek = board.recentWeeks[0];
  const isThisWeek = board.weekAnchor === thisWeek;

  function loadWeek(anchor: string) {
    if (anchor === board.weekAnchor) return;
    startTransition(async () => {
      const res = await getAttendanceBoard(anchor);
      if (res.state === 'ready') setBoard(res);
    });
  }

  function toggle(member: AttendanceMemberRow) {
    const next = !member.confirmed;
    // Optimistic: flip immediately, then sync with the server.
    setBoard((b) => ({
      ...b,
      rows: b.rows.map((r) => (r.userId === member.userId ? { ...r, confirmed: next } : r)),
      confirmedCount: b.confirmedCount + (next ? 1 : -1),
    }));
    startTransition(async () => {
      await setMemberAttendance(member.userId, board.weekAnchor, next);
      const res = await getAttendanceBoard(board.weekAnchor);
      if (res.state === 'ready') setBoard(res);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Week switcher */}
      <div className="flex flex-wrap gap-2">
        {board.recentWeeks.map((anchor, i) => {
          const active = anchor === board.weekAnchor;
          return (
            <button
              key={anchor}
              type="button"
              onClick={() => loadWeek(anchor)}
              className={cn(
                'rounded-sm border px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors',
                active
                  ? 'border-border-gold bg-gold/[0.1] text-gold-lt'
                  : 'border-border-sub text-silver hover:text-ivory',
              )}
            >
              {i === 0 ? 'This week' : weekShort(anchor)}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-baseline justify-between rounded-sm border border-border-sub bg-black-3 px-5 py-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            {isThisWeek ? 'This week' : `Week of ${weekShort(board.weekAnchor)}`}
          </p>
          <p className="mt-1 font-display text-2xl font-light text-ivory">
            {board.confirmedCount}
            <span className="text-base text-silver"> of {board.rows.length} present</span>
          </p>
        </div>
        {pending && (
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">Saving…</span>
        )}
      </div>

      {/* Member rows */}
      <ul className="flex flex-col gap-2">
        {board.rows.map((member, i) => (
          <motion.li
            key={member.userId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.03 }}
            className="flex items-center gap-3 rounded-sm border border-border-sub bg-black-3 p-3"
          >
            <Avatar name={member.name} imageUrl={member.imageUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ivory">
                {member.name}
                {member.isLeader && (
                  <span className="ml-2 align-middle text-[9px] uppercase tracking-[0.16em] text-gold">
                    leader
                  </span>
                )}
              </p>
              {member.checkedIn && !member.confirmed && (
                <p className="mt-0.5 text-[11px] text-gold-lt">Checked themselves in — confirm?</p>
              )}
              {!member.checkedIn && !member.confirmed && (
                <p className="mt-0.5 text-[11px] text-muted">No check-in yet</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => toggle(member)}
              aria-pressed={member.confirmed}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-sm border px-3.5 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-colors',
                member.confirmed
                  ? 'border-emerald bg-emerald/15 text-emerald-lt'
                  : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
              )}
            >
              {member.confirmed ? (
                <>
                  <CheckIcon /> Present
                </>
              ) : (
                'Mark present'
              )}
            </button>
          </motion.li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted">
        Only confirmed weeks count toward a member&rsquo;s walk. Showing up in person is the
        heartbeat of this — the dashboard only reflects it.
      </p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
