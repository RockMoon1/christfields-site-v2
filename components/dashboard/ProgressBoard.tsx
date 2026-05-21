'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AREA_COLORS } from '@/lib/colors';
import {
  createArea,
  deleteArea,
  logScore,
  type AreaWithEntries,
} from '@/app/dashboard/(app)/progress/actions';

interface ProgressBoardProps {
  initialAreas: AreaWithEntries[];
}

/**
 * Self-tracked progress areas. Mix of preset areas (auto-created, undeletable)
 * and user-created custom areas. Each area has rich context (description,
 * why it matters, target score) and each score can carry a reflection note.
 */
export function ProgressBoard({ initialAreas }: ProgressBoardProps) {
  const [areas, setAreas] = useState<AreaWithEntries[]>(initialAreas);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(input: {
    name: string;
    description: string;
    whyItMatters: string;
    targetScore: number;
    color: string;
  }) {
    const tempId = `temp-${Date.now()}`;
    setAreas((prev) => [
      ...prev,
      {
        id: tempId,
        name: input.name,
        description: input.description,
        whyItMatters: input.whyItMatters,
        targetScore: input.targetScore,
        presetKey: null,
        color: input.color,
        entries: [],
      },
    ]);
    setShowAdd(false);

    startTransition(async () => {
      try {
        const realArea = await createArea(input);
        setAreas((prev) => prev.map((a) => (a.id === tempId ? realArea : a)));
      } catch (err) {
        setAreas((prev) => prev.filter((a) => a.id !== tempId));
        alert('Could not save area. Please try again.');
        console.error(err);
      }
    });
  }

  function handleLog(areaId: string, score: number, note: string) {
    if (areaId.startsWith('temp-')) {
      alert('Hold on a second, that area is still being saved.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, entries: [...a.entries, { score, date: today, note }] }
          : a,
      ),
    );

    startTransition(async () => {
      try {
        await logScore(areaId, score, note);
      } catch (err) {
        setAreas((prev) =>
          prev.map((a) =>
            a.id === areaId ? { ...a, entries: a.entries.slice(0, -1) } : a,
          ),
        );
        alert('Could not save score. Please try again.');
        console.error(err);
      }
    });
  }

  function handleRemove(areaId: string) {
    if (areaId.startsWith('temp-')) {
      setAreas((prev) => prev.filter((a) => a.id !== areaId));
      return;
    }

    const removed = areas.find((a) => a.id === areaId);
    if (removed?.presetKey) {
      alert('Preset areas are part of every account and cannot be removed.');
      return;
    }

    setAreas((prev) => prev.filter((a) => a.id !== areaId));

    startTransition(async () => {
      try {
        await deleteArea(areaId);
      } catch (err) {
        if (removed) setAreas((prev) => [...prev, removed]);
        alert('Could not remove area. Please try again.');
        console.error(err);
      }
    });
  }

  const presence = areas.find((a) => a.presetKey === 'presence') ?? null;
  const rest = areas.filter((a) => a.presetKey !== 'presence');

  return (
    <div>
      {presence && (
        <motion.div layout className="mb-6">
          <AreaCard
            area={presence}
            onLog={handleLog}
            onRemove={handleRemove}
            featured
            featuredLabel="The heart of FaithFlow"
          />
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {rest.map((area) => (
            <motion.div
              key={area.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <AreaCard area={area} onLog={handleLog} onRemove={handleRemove} />
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div layout>
          {showAdd ? (
            <AddAreaForm
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
                Add a new area
              </span>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================
   Add-area form. Expanded with why-it-matters and target-score.
   ============================================================ */

interface AddAreaFormProps {
  onCancel: () => void;
  onSubmit: (input: {
    name: string;
    description: string;
    whyItMatters: string;
    targetScore: number;
    color: string;
  }) => void;
  isPending: boolean;
}

function AddAreaForm({ onCancel, onSubmit, isPending }: AddAreaFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [targetScore, setTargetScore] = useState(8);
  const [color, setColor] = useState(AREA_COLORS[0].hex);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      whyItMatters: whyItMatters.trim(),
      targetScore,
      color,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-full flex-col gap-3 rounded-sm border border-border-gold bg-black-3 p-6"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        New area
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. Patience)"
        autoFocus
        maxLength={100}
        className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="One short sentence about what this area means to you."
        rows={2}
        maxLength={500}
        className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <textarea
        value={whyItMatters}
        onChange={(e) => setWhyItMatters(e.target.value)}
        placeholder="Why does this matter to you?"
        rows={2}
        maxLength={500}
        className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />

      {/* Color picker */}
      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
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

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Target score
          </label>
          <span className="font-display text-xl font-light text-gold-lt">{targetScore}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={targetScore}
          onChange={(e) => setTargetScore(parseInt(e.target.value, 10))}
          className="w-full accent-gold"
        />
      </div>
      <div className="mt-auto flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-sm bg-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt disabled:opacity-70"
        >
          {isPending ? 'Saving...' : 'Add area'}
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
   Individual area card. Richer with target score, why it
   matters, optional reflection note when logging.
   ============================================================ */

interface AreaCardProps {
  area: AreaWithEntries;
  onLog: (areaId: string, score: number, note: string) => void;
  onRemove: (areaId: string) => void;
  featured?: boolean;
  featuredLabel?: string;
}

function AreaCard({ area, onLog, onRemove, featured = false, featuredLabel }: AreaCardProps) {
  const latest = area.entries[area.entries.length - 1];
  const prev = area.entries[area.entries.length - 2];
  const delta = latest && prev ? latest.score - prev.score : 0;
  const [draft, setDraft] = useState(latest?.score ?? area.targetScore ?? 5);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const isPreset = !!area.presetKey;

  function save() {
    onLog(area.id, draft, note);
    setNote('');
    setShowNote(false);
  }

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-sm border p-6 pl-7 transition-colors',
        featured
          ? 'border-border-gold bg-gradient-to-br from-black-3 to-black-2 shadow-[0_0_45px_rgba(201,165,72,0.10)]'
          : 'border-border-sub bg-black-3 hover:border-border-gold',
      )}
    >
      {/* Color stripe: ties this card visually to its dot on the orb */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: area.color, boxShadow: `0 0 12px ${area.color}55` }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {featured && featuredLabel && (
        <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-sm border border-gold/30 bg-gold/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          {featuredLabel}
        </p>
      )}

      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: area.color, boxShadow: `0 0 6px ${area.color}aa` }}
            />
            <h3 className="font-display text-2xl font-light text-ivory">{area.name}</h3>
            {isPreset && (
              <span className="rounded-sm border border-gold/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">
                Core
              </span>
            )}
          </div>
          {area.description && (
            <p className="text-xs text-silver">{area.description}</p>
          )}
        </div>
        {!isPreset && (
          <button
            type="button"
            onClick={() => onRemove(area.id)}
            className="text-muted opacity-0 transition-opacity hover:text-silver group-hover:opacity-100"
            aria-label={`Remove ${area.name}`}
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* Why it matters */}
      {area.whyItMatters && (
        <p className="mb-5 border-l-2 border-gold/40 pl-3 font-display text-sm italic leading-relaxed text-ivory-dim">
          {area.whyItMatters}
        </p>
      )}

      {/* Score display */}
      <div className="mb-5 flex items-end gap-3">
        <p className="font-display text-5xl font-light leading-none text-gold-lt">
          {latest?.score ?? '—'}
        </p>
        <p className="pb-1 text-xs text-muted">/ 10</p>
        {area.targetScore && (
          <p className="pb-1 text-xs text-muted">
            · aiming for {area.targetScore}
          </p>
        )}
        {delta !== 0 && (
          <p
            className={cn(
              'pb-1 text-xs font-medium',
              delta > 0 ? 'text-emerald-lt' : 'text-red-400',
            )}
          >
            {delta > 0 ? '+' : ''}
            {delta}
          </p>
        )}
      </div>

      {area.entries.length > 1 ? (
        <Sparkline entries={area.entries} target={area.targetScore} />
      ) : area.entries.length === 1 ? (
        <p className="mb-5 text-xs italic text-muted">Log another to start the line.</p>
      ) : (
        <p className="mb-5 text-xs italic text-muted">Log your first score below.</p>
      )}

      {/* New score input */}
      <div className="mt-auto border-t border-border-sub pt-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Log today
          </label>
          <span className="font-display text-2xl font-light text-ivory">{draft}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={draft}
          onChange={(e) => setDraft(parseInt(e.target.value, 10))}
          className="w-full accent-gold"
        />

        {/* Optional reflection note */}
        {showNote ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="One sentence. Why this score?"
            rows={2}
            maxLength={280}
            autoFocus
            className="mt-3 w-full rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-xs text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-gold"
          >
            + Add a note (optional)
          </button>
        )}

        <button
          type="button"
          onClick={save}
          className="mt-3 w-full rounded-sm border border-gold/45 bg-transparent px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
        >
          Save score
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   Sparkline with optional target-score reference line.
   ============================================================ */

function Sparkline({
  entries,
  target,
}: {
  entries: { score: number; date: string }[];
  target?: number | null;
}) {
  const w = 320;
  const h = 56;
  const padX = 4;
  const padY = 6;
  const min = 1;
  const max = 10;
  const n = entries.length;

  const yFor = (score: number) =>
    h - padY - ((score - min) / (max - min)) * (h - padY * 2);

  const points = entries.map((e, i) => {
    const x = padX + (i / (n - 1)) * (w - padX * 2);
    return `${x.toFixed(1)},${yFor(e.score).toFixed(1)}`;
  });

  const last = entries[entries.length - 1];
  const lastX = padX + (w - padX * 2);
  const lastY = yFor(last.score);

  const targetY = target ? yFor(target) : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mb-5 h-14 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Target line, if a target is set */}
      {targetY !== null && (
        <line
          x1={0}
          y1={targetY}
          x2={w}
          y2={targetY}
          stroke="rgba(228,201,122,0.35)"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
      )}
      <polygon
        points={`${padX},${h - padY} ${points.join(' ')} ${w - padX},${h - padY}`}
        fill="url(#sparkFill)"
        opacity={0.25}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#c9a548"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={3} fill="#e4c97a" />
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a548" />
          <stop offset="100%" stopColor="#c9a548" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
