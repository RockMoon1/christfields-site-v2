'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AREA_COLORS } from '@/lib/colors';
import { graceNoteForToday } from '@/lib/dashboard/content';
import {
  toggleToday,
  createPractice,
  archivePractice,
  type RhythmWithStatus,
} from '@/app/dashboard/(app)/rhythms/actions';
import { RhythmCard } from './RhythmCard';
import { SaveNote } from './SaveNote';
import type { Cadence } from '@/lib/supabase';

interface RhythmBoardProps {
  initialRhythms: RhythmWithStatus[];
}

/* ============================================================
   Selectable icons for the add form.
   ============================================================ */

const ICON_OPTIONS = [
  { key: 'book', label: 'Book' },
  { key: 'pray', label: 'Prayer' },
  { key: 'heart', label: 'Heart' },
  { key: 'moon', label: 'Moon' },
  { key: 'sun', label: 'Sun' },
  { key: 'people', label: 'People' },
  { key: 'flame', label: 'Flame' },
  { key: 'sabbath', label: 'Sabbath' },
] as const;

function IconPreview({ icon }: { icon: string }) {
  const cls = 'h-4 w-4';
  switch (icon) {
    case 'book':
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><rect x="4" y="3" width="9" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" /><path d="M4 3h2M4 17h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M7 7h4M7 10h4M7 13h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
    case 'pray':
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><path d="M8 14c0 0 1-1 2-1s2 1 2 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M7 8l-2 4h10l-2-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" /></svg>;
    case 'heart':
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><path d="M10 16s-7-4.5-7-8.5C3 5 4.5 3.5 6.5 3.5c1 0 2.5.8 3.5 2 1-1.2 2.5-2 3.5-2C15.5 3.5 17 5 17 7.5 17 11.5 10 16 10 16z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
    case 'moon':
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><path d="M15 11A6 6 0 1 1 9 5c0 3.3 2.7 6 6 6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
    case 'sun':
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.4" /><path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M5.05 5.05l1.06 1.06M13.89 13.89l1.06 1.06M5.05 14.95l1.06-1.06M13.89 6.11l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    case 'people':
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><circle cx="7.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M2 16c0-3 2.5-5 5.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="13" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" /><path d="M13 12c2.5 0 5 2 5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    case 'sabbath':
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><path d="M5 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M10 4v3M10 13v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" /></svg>;
    case 'flame':
    default:
      return <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden><path d="M10 17c-3.3 0-6-2.2-6-5.5 0-2.5 1.5-4.5 3-6 0 2 .8 3 2 3.5C9 7 9.5 4 11 3c0 2 1 3.5 2.5 4.5 1 .7 1.5 1.7 1.5 3C15 14.8 13.3 17 10 17z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
  }
}

/* ============================================================
   Add-rhythm inline form.
   ============================================================ */

interface AddRhythmFormProps {
  onCancel: () => void;
  onSubmit: (input: {
    name: string;
    description: string;
    icon: string;
    color: string;
    cadence: Cadence;
    targetPerWeek: number;
    scripture: string;
    anchor: string;
  }) => void;
  isPending: boolean;
}

function AddRhythmForm({ onCancel, onSubmit, isPending }: AddRhythmFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [anchor, setAnchor] = useState('');
  const [cadence, setCadence] = useState<Cadence>('daily');
  const [targetPerWeek, setTargetPerWeek] = useState(3);
  const [color, setColor] = useState(AREA_COLORS[0].hex);
  const [icon, setIcon] = useState<string>('flame');
  const [scripture, setScripture] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      cadence,
      targetPerWeek: cadence === 'daily' ? 7 : targetPerWeek,
      scripture: scripture.trim(),
      anchor: anchor.trim(),
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-full flex-col gap-4 rounded-sm border border-border-gold bg-black-3 p-6"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        New rhythm
      </p>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. Journaling)"
        autoFocus
        maxLength={100}
        className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="One short sentence about what this looks like for you."
        rows={2}
        maxLength={500}
        className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      {/* Habit stacking anchor */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Habit anchor (optional)
        </label>
        <input
          type="text"
          value={anchor}
          onChange={(e) => setAnchor(e.target.value)}
          placeholder="After I ___, I will ___."
          maxLength={280}
          className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>

      {/* Cadence toggle */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Cadence
        </label>
        <div className="flex gap-2">
          {(['daily', 'weekly'] as Cadence[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              className={cn(
                'flex-1 rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.07em] transition-colors',
                cadence === c
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border-sub text-muted hover:border-border-gold hover:text-silver',
              )}
            >
              {c === 'daily' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>
      </div>

      {/* Target per week (weekly only) */}
      {cadence === 'weekly' && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
              Target per week
            </label>
            <span className="font-display text-xl font-light text-gold-lt">{targetPerWeek}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={7}
            value={targetPerWeek}
            onChange={(e) => setTargetPerWeek(parseInt(e.target.value, 10))}
            className="w-full accent-gold"
          />
        </div>
      )}

      {/* Icon picker */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setIcon(opt.key)}
              aria-label={opt.label}
              title={opt.label}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-sm border transition-colors',
                icon === opt.key
                  ? 'border-gold text-gold'
                  : 'border-border-sub text-muted hover:border-border-gold hover:text-silver',
              )}
            >
              <IconPreview icon={opt.key} />
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {AREA_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setColor(c.hex)}
              aria-label={c.label}
              title={c.label}
              className={cn(
                'h-7 w-7 rounded-full border-2 transition-transform',
                color === c.hex
                  ? 'scale-110 border-ivory'
                  : 'border-transparent hover:scale-105',
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Scripture (optional) */}
      <input
        type="text"
        value={scripture}
        onChange={(e) => setScripture(e.target.value)}
        placeholder="Scripture reference (e.g. Psalm 23:1)"
        maxLength={100}
        className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      {/* Actions */}
      <div className="mt-auto flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="flex-1 rounded-sm bg-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Add rhythm'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-border-sub px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   RhythmBoard: the main client board.
   ============================================================ */

export function RhythmBoard({ initialRhythms }: RhythmBoardProps) {
  const [rhythms, setRhythms] = useState<RhythmWithStatus[]>(initialRhythms);
  const [showAdd, setShowAdd] = useState(false);
  // Inline instead of alert(): a native dialog is jarring against the calm of
  // this page, and the rest of the dashboard already says things this way.
  const [note, setNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalDoneToday = rhythms.filter((r) => r.doneToday).length;
  const graceNote = graceNoteForToday();
  const nothingDoneToday = totalDoneToday === 0;

  function handleToggle(practiceId: string) {
    if (practiceId.startsWith('temp-')) {
      return;
    }

    // Keep the row exactly as it was, so a failure restores the truth rather
    // than trying to invert the change a second time.
    const before = rhythms.find((r) => r.id === practiceId);

    setRhythms((prev) =>
      prev.map((r) =>
        r.id === practiceId
          ? {
              ...r,
              doneToday: !r.doneToday,
              weekDone: r.doneToday ? Math.max(0, r.weekDone - 1) : r.weekDone + 1,
              // Unchecking today has to walk the streak back too, otherwise the
              // count keeps climbing every time it is toggled off and on.
              currentStreak: r.doneToday
                ? Math.max(0, r.currentStreak - 1)
                : r.currentStreak + 1,
              last7: r.last7.map((d, i) =>
                i === r.last7.length - 1 ? { ...d, done: !r.doneToday } : d,
              ),
            }
          : r,
      ),
    );

    startTransition(async () => {
      try {
        await toggleToday(practiceId);
      } catch (err) {
        if (before) {
          setRhythms((prev) => prev.map((r) => (r.id === practiceId ? before : r)));
        }
        console.error('toggleToday failed', err);
        setNote('Could not save that just now. Please try again.');
      }
    });
  }

  function handleAdd(input: {
    name: string;
    description: string;
    icon: string;
    color: string;
    cadence: 'daily' | 'weekly';
    targetPerWeek: number;
    scripture: string;
    anchor: string;
  }) {
    const tempId = `temp-${Date.now()}`;
    const last7 = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
      done: false,
    }));

    setRhythms((prev) => [
      ...prev,
      {
        id: tempId,
        ...input,
        presetKey: null,
        doneToday: false,
        currentStreak: 0,
        weekDone: 0,
        totalDays: 0,
        last7,
      },
    ]);
    setShowAdd(false);

    startTransition(async () => {
      try {
        const real = await createPractice(input);
        setRhythms((prev) => prev.map((r) => (r.id === tempId ? real : r)));
      } catch (err) {
        setRhythms((prev) => prev.filter((r) => r.id !== tempId));
        setNote('Could not save that rhythm. Please try again.');
        console.error(err);
      }
    });
  }

  function handleRemove(practiceId: string) {
    if (practiceId.startsWith('temp-')) {
      setRhythms((prev) => prev.filter((r) => r.id !== practiceId));
      return;
    }

    const removed = rhythms.find((r) => r.id === practiceId);
    if (removed?.presetKey) {
      setNote('Core rhythms are part of every account, so they stay.');
      return;
    }

    setRhythms((prev) => prev.filter((r) => r.id !== practiceId));

    startTransition(async () => {
      try {
        await archivePractice(practiceId);
      } catch (err) {
        if (removed) setRhythms((prev) => [...prev, removed]);
        setNote('Could not remove that rhythm. Please try again.');
        console.error(err);
      }
    });
  }

  return (
    <div>
      <SaveNote message={note} />

      {/* Summary bar */}
      <div className="mb-8 flex flex-col gap-1">
        {totalDoneToday > 0 && (
          <p className="text-sm text-ivory-dim">
            {totalDoneToday} {totalDoneToday === 1 ? 'rhythm' : 'rhythms'} tended to today.
            {totalDoneToday === rhythms.length && rhythms.length > 0 && ' All of them.'}
          </p>
        )}
        {nothingDoneToday && (
          <p className="text-xs text-gold/60">{graceNote}</p>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {rhythms.map((rhythm) => (
            <motion.div
              key={rhythm.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <RhythmCard
                rhythm={rhythm}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add card */}
        <motion.div layout>
          {showAdd ? (
            <AddRhythmForm
              onCancel={() => setShowAdd(false)}
              onSubmit={handleAdd}
              isPending={isPending}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="group flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border-sub bg-transparent p-6 transition-colors hover:border-border-gold hover:bg-black-3/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border-sub text-gold transition-colors group-hover:border-border-gold">
                <PlusIcon />
              </span>
              <span className="text-sm text-silver transition-colors group-hover:text-ivory">
                Add a rhythm
              </span>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
