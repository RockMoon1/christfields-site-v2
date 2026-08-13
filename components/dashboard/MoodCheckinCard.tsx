'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MOOD_LEVELS, EMOTION_WORDS, graceNoteForToday } from '@/lib/dashboard/content';
import type { MoodCheckin } from '@/lib/supabase';
import { saveMood } from '@/app/dashboard/(app)/reflect/actions';
import { SaveNote, SAVE_FAILED } from './SaveNote';

interface MoodCheckinCardProps {
  initialMood: MoodCheckin | null;
  recentMoods: { date: string; mood: number }[];
}

export function MoodCheckinCard({ initialMood, recentMoods }: MoodCheckinCardProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(initialMood?.mood ?? null);
  const [selectedEmotion, setSelectedEmotion] = useState<string>(initialMood?.label ?? '');
  const [note, setNote] = useState(initialMood?.note ?? '');
  const [saved, setSaved] = useState(!!initialMood);
  const [showGrace, setShowGrace] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMoodSelect(value: number) {
    setSelectedMood(value);
    setSelectedEmotion('');
    setSaved(false);
    setShowGrace(false);
  }

  function handleSave() {
    if (!selectedMood) return;
    const level = MOOD_LEVELS.find((l) => l.value === selectedMood);
    const label = selectedEmotion || level?.label || '';

    setSaveError(null);
    startTransition(async () => {
      try {
        await saveMood({ mood: selectedMood, label, note });
        setSaved(true);
        if (selectedMood <= 2) setShowGrace(true);
      } catch (err) {
        console.error('saveMood failed', err);
        setSaveError(SAVE_FAILED);
      }
    });
  }

  const activeMoodLevel = MOOD_LEVELS.find((l) => l.value === selectedMood);

  return (
    <article className="flex flex-col gap-5 rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold">
      <header>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Mood
        </p>
        <h2 className="font-display text-2xl font-light text-ivory">How are you today?</h2>
      </header>

      {/* 5-level mood selector */}
      <div className="flex gap-2">
        {MOOD_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => handleMoodSelect(level.value)}
            title={level.caption}
            aria-label={level.label}
            aria-pressed={selectedMood === level.value}
            className={cn(
              'flex flex-1 flex-col items-center gap-1.5 rounded-sm border py-3 text-center transition-all',
              selectedMood === level.value
                ? 'border-transparent'
                : 'border-border-sub bg-black-2 hover:border-border-gold',
            )}
            style={
              selectedMood === level.value
                ? { borderColor: level.color + '55', backgroundColor: level.color + '18' }
                : {}
            }
          >
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: level.color }}
            />
            <span
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: selectedMood === level.value ? level.color : undefined }}
            >
              {selectedMood !== level.value && (
                <span className="text-muted">{level.label}</span>
              )}
              {selectedMood === level.value && level.label}
            </span>
          </button>
        ))}
      </div>

      {/* Caption */}
      {activeMoodLevel && (
        <motion.p
          key={activeMoodLevel.value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs italic text-silver"
        >
          {activeMoodLevel.caption}
        </motion.p>
      )}

      {/* Emotion words */}
      <AnimatePresence>
        {selectedMood !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              Name it more precisely (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {EMOTION_WORDS.map((group) =>
                group.words.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() =>
                      setSelectedEmotion((prev) => (prev === word ? '' : word))
                    }
                    aria-pressed={selectedEmotion === word}
                    className={cn(
                      'min-h-[44px] rounded-sm border px-3 py-2 text-[11px] tracking-wide transition-all',
                      selectedEmotion === word
                        ? 'border-gold/50 bg-gold/10 text-gold-lt'
                        : 'border-border-sub text-silver hover:border-border-gold hover:text-ivory',
                    )}
                  >
                    {word}
                  </button>
                )),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional note */}
      {selectedMood !== null && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything else on your mind? (optional)"
          rows={2}
          maxLength={500}
          className="w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
        />
      )}

      {/* Save button */}
      {selectedMood !== null && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-sm border border-gold/45 bg-transparent px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-60"
        >
          {isPending ? 'Saving...' : saved ? 'Saved' : 'Save check-in'}
        </button>
      )}

      <SaveNote message={saveError} />

      {/* Grace note for low moods */}
      <AnimatePresence>
        {showGrace && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-sm border border-border-gold bg-black-4 p-4"
          >
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
              A word for you
            </p>
            <p className="text-sm leading-relaxed text-ivory-dim">{graceNoteForToday()}</p>
            <p className="mt-2 text-xs text-muted">A two minute prayer counts.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 30-day mood sparkline */}
      {recentMoods.length > 1 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Recent check-ins
          </p>
          <MoodSparkline data={recentMoods} />
        </div>
      )}
    </article>
  );
}

/* ============================================================
   30-day mood sparkline. Scale: 1-5.
   ============================================================ */

function MoodSparkline({ data }: { data: { date: string; mood: number }[] }) {
  const w = 320;
  const h = 40;
  const padX = 4;
  const padY = 4;
  const min = 1;
  const max = 5;
  const n = data.length;
  if (n < 2) return null;

  const yFor = (mood: number) =>
    h - padY - ((mood - min) / (max - min)) * (h - padY * 2);

  const points = data.map((d, i) => {
    const x = padX + (i / (n - 1)) * (w - padX * 2);
    return `${x.toFixed(1)},${yFor(d.mood).toFixed(1)}`;
  });

  const last = data[n - 1];
  const lastX = padX + (w - padX * 2);
  const lastY = yFor(last.mood);

  // Color the endpoint dot by the last mood's color.
  const lastLevel = MOOD_LEVELS.find((l) => l.value === last.mood);
  const dotColor = lastLevel?.color ?? '#e4c97a';

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-10 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon
        points={`${padX},${h - padY} ${points.join(' ')} ${w - padX},${h - padY}`}
        fill="url(#moodSparkFill)"
        opacity={0.2}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#c9a548"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={3} fill={dotColor} />
      <defs>
        <linearGradient id="moodSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a548" />
          <stop offset="100%" stopColor="#c9a548" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
