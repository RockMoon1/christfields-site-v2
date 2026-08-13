'use client';

import { useState } from 'react';

/**
 * One slot in the planning heatmap, tappable to reveal who is free.
 *
 * The names used to live only in a title attribute, which never appears on a
 * touch screen, and the leader dashboard is explicitly built for desktop and
 * iPad. On a tablet a leader simply could not see who was free, which is the
 * one question this grid exists to answer.
 */
export function PlanCell({
  freeCount,
  total,
  freeNames,
  label,
}: {
  freeCount: number;
  total: number;
  freeNames: string[];
  /** Human description of the slot, e.g. "Tue Mar 3, evening". */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ratio = total > 0 ? freeCount / total : 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={
          freeNames.length > 0
            ? `${label}: ${freeNames.length} free. ${freeNames.join(', ')}`
            : `${label}: no one marked free`
        }
        className="flex h-9 w-full items-center justify-center rounded-sm border border-border-sub text-xs transition-colors hover:border-border-gold"
        style={{
          backgroundColor: `rgba(201, 165, 72, ${(0.06 + ratio * 0.5).toFixed(3)})`,
          color: ratio > 0.45 ? '#e4c97a' : ratio > 0 ? '#c9b98a' : '#7e8c84',
        }}
      >
        {freeCount}
        <span className="text-muted">/{total}</span>
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-1 w-44 -translate-x-1/2 rounded-sm border border-border-gold bg-black-2 p-3 shadow-2xl">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gold">
            {label}
          </p>
          {freeNames.length > 0 ? (
            <p className="text-[11px] leading-relaxed text-ivory-dim">{freeNames.join(', ')}</p>
          ) : (
            <p className="text-[11px] italic text-muted">No one marked free.</p>
          )}
        </div>
      )}
    </div>
  );
}
