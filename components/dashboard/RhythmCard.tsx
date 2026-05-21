'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { faithfulnessLine } from '@/lib/dashboard/streaks';
import type { RhythmWithStatus } from '@/app/dashboard/(app)/rhythms/actions';

interface RhythmCardProps {
  rhythm: RhythmWithStatus;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/* ============================================================
   Minimal line SVG icons. One per key, default to flame.
   ============================================================ */

function IconFor({ icon }: { icon: string }) {
  const cls = 'h-5 w-5';
  switch (icon) {
    case 'book':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <rect x="4" y="3" width="9" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <path d="M4 3h2M4 17h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M7 7h4M7 10h4M7 13h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'pray':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path d="M8 14c0 0 1-1 2-1s2 1 2 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M7 8l-2 4h10l-2-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path d="M10 16s-7-4.5-7-8.5C3 5 4.5 3.5 6.5 3.5c1 0 2.5.8 3.5 2 1-1.2 2.5-2 3.5-2C15.5 3.5 17 5 17 7.5 17 11.5 10 16 10 16z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path d="M15 11A6 6 0 1 1 9 5c0 3.3 2.7 6 6 6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M5.05 5.05l1.06 1.06M13.89 13.89l1.06 1.06M5.05 14.95l1.06-1.06M13.89 6.11l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'people':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <circle cx="7.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 16c0-3 2.5-5 5.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="13" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13 12c2.5 0 5 2 5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'sabbath':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path d="M5 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M10 4v3M10 13v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'flame':
    default:
      return (
        <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
          <path d="M10 17c-3.3 0-6-2.2-6-5.5 0-2.5 1.5-4.5 3-6 0 2 .8 3 2 3.5C9 7 9.5 4 11 3c0 2 1 3.5 2.5 4.5 1 .7 1.5 1.7 1.5 3C15 14.8 13.3 17 10 17z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
  }
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M8 14c-2.8 0-5-1.8-5-4.5C3 7.5 4.2 6 5.5 5c0 1.5.7 2.5 1.5 3 0-1.5.5-3.5 1.5-4 0 1.5.8 2.8 2 3.5.8.6 1.5 1.5 1.5 2.5C12 12.2 10.8 14 8 14z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function RhythmCard({ rhythm, onToggle, onRemove }: RhythmCardProps) {
  const isPreset = !!rhythm.presetKey;
  const target = rhythm.cadence === 'weekly' ? rhythm.targetPerWeek : 7;
  const faithLine = faithfulnessLine(rhythm.weekDone, target);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6 pl-7 transition-colors hover:border-border-gold">
      {/* Color stripe */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: rhythm.color, boxShadow: `0 0 12px ${rhythm.color}55` }}
      />
      {/* Hover shimmer */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-gold-lt" style={{ color: rhythm.color }}>
              <IconFor icon={rhythm.icon} />
            </span>
            <h3 className="font-display text-2xl font-light text-ivory">{rhythm.name}</h3>
            {isPreset && (
              <span className="rounded-sm border border-gold/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">
                Core
              </span>
            )}
          </div>
          {rhythm.description && (
            <p className="text-xs text-silver">{rhythm.description}</p>
          )}
        </div>
        {!isPreset && (
          <button
            type="button"
            onClick={() => onRemove(rhythm.id)}
            className="text-muted opacity-0 transition-opacity hover:text-silver group-hover:opacity-100"
            aria-label={`Archive ${rhythm.name}`}
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* Anchor (habit stacking cue) */}
      {rhythm.anchor && (
        <p className="mb-4 border-l-2 border-gold/30 pl-3 text-xs italic leading-relaxed text-ivory-dim">
          {rhythm.anchor}
        </p>
      )}

      {/* Big check-off control */}
      <div className="mb-5 flex items-center gap-4">
        <motion.button
          type="button"
          onClick={() => onToggle(rhythm.id)}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={cn(
            'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
            rhythm.doneToday
              ? 'border-transparent bg-gold shadow-[0_0_16px_rgba(201,165,72,0.45)]'
              : 'border-border-sub bg-black-4 hover:border-gold/50',
          )}
          aria-label={rhythm.doneToday ? 'Mark as not done today' : 'Mark as done today'}
          aria-pressed={rhythm.doneToday}
        >
          {rhythm.doneToday && (
            <motion.svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-7 w-7"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              aria-hidden
            >
              <path
                d="M4.5 10l4 4 7-7"
                stroke="#060908"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </motion.button>
        <div>
          <p className={cn('text-sm font-medium', rhythm.doneToday ? 'text-gold' : 'text-silver')}>
            {rhythm.doneToday ? 'Done today' : 'Tap to mark today'}
          </p>
          {rhythm.currentStreak >= 2 && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ivory-dim">
              <span className="text-gold"><FlameIcon /></span>
              {rhythm.currentStreak} day rhythm
            </p>
          )}
        </div>
      </div>

      {/* 7-dot week strip */}
      <div className="mb-2 flex items-center gap-1.5" aria-label="Last 7 days">
        {rhythm.last7.map((day, i) => {
          const isToday = i === rhythm.last7.length - 1;
          return (
            <span
              key={day.date}
              title={day.date}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors',
                day.done
                  ? 'bg-gold'
                  : 'border border-border-sub bg-transparent',
                isToday && !day.done && 'ring-1 ring-gold/40 ring-offset-1 ring-offset-black-3',
                isToday && day.done && 'ring-1 ring-gold-lt/60 ring-offset-1 ring-offset-black-3',
              )}
            />
          );
        })}
      </div>

      {/* Faithfulness line */}
      <p className="mb-3 text-[11px] text-ivory-dim">{faithLine}</p>

      {/* Scripture reference */}
      {rhythm.scripture && (
        <p className="mt-auto text-[10px] uppercase tracking-[0.16em] text-muted">
          {rhythm.scripture}
        </p>
      )}
    </article>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
