'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Entry {
  /** Score from 1 to 10. */
  score: number;
  /** ISO date string. */
  date: string;
}

interface Area {
  id: string;
  name: string;
  description: string;
  entries: Entry[];
}

const SEED_AREAS: Area[] = [
  {
    id: 'socializing',
    name: 'Socializing',
    description: 'Showing up. Reaching out. Being present in person.',
    entries: [
      { score: 4, date: '2026-04-12' },
      { score: 5, date: '2026-04-26' },
      { score: 6, date: '2026-05-10' },
    ],
  },
  {
    id: 'scripture',
    name: 'Scripture',
    description: 'Reading slowly. Letting it sit. Coming back to it.',
    entries: [
      { score: 5, date: '2026-04-15' },
      { score: 7, date: '2026-05-01' },
    ],
  },
];

/**
 * Self-tracked progress areas with 1-10 scoring and a simple history chart.
 * Tonight everything is stored in component state. Next session this will
 * read and write from the database, keyed to the signed-in Clerk user.
 */
export function ProgressBoard() {
  const [areas, setAreas] = useState<Area[]>(SEED_AREAS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function addArea(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, '-');
    setAreas((prev) => [
      ...prev,
      { id, name: newName.trim(), description: newDesc.trim(), entries: [] },
    ]);
    setNewName('');
    setNewDesc('');
    setShowAdd(false);
  }

  function logScore(areaId: string, score: number) {
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? {
              ...a,
              entries: [
                ...a.entries,
                { score, date: new Date().toISOString().split('T')[0] },
              ],
            }
          : a,
      ),
    );
  }

  function removeArea(areaId: string) {
    setAreas((prev) => prev.filter((a) => a.id !== areaId));
  }

  return (
    <div>
      {/* Areas grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {areas.map((area) => (
            <motion.div
              key={area.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <AreaCard area={area} onLog={logScore} onRemove={removeArea} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add new card */}
        <motion.div layout>
          {showAdd ? (
            <form
              onSubmit={addArea}
              className="flex h-full flex-col gap-3 rounded-sm border border-border-gold bg-black-3 p-6"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
                New area
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Patience"
                autoFocus
                className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="One short sentence about what this area means to you."
                rows={2}
                className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
              />
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-sm bg-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-sm border border-border-sub px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
                >
                  Cancel
                </button>
              </div>
            </form>
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
   Individual area card. Shows name, latest score, sparkline,
   and an interactive 1-10 slider to log a new score.
   ============================================================ */

interface AreaCardProps {
  area: Area;
  onLog: (areaId: string, score: number) => void;
  onRemove: (areaId: string) => void;
}

function AreaCard({ area, onLog, onRemove }: AreaCardProps) {
  const latest = area.entries[area.entries.length - 1];
  const prev = area.entries[area.entries.length - 2];
  const delta = latest && prev ? latest.score - prev.score : 0;
  const [draft, setDraft] = useState(latest?.score ?? 5);

  return (
    <article className="group relative h-full overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-1 font-display text-2xl font-light text-ivory">{area.name}</h3>
          <p className="text-xs text-silver">{area.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(area.id)}
          className="text-muted opacity-0 transition-opacity hover:text-silver group-hover:opacity-100"
          aria-label={`Remove ${area.name}`}
        >
          <XIcon />
        </button>
      </div>

      {/* Big score display */}
      <div className="mb-5 flex items-end gap-3">
        <p className="font-display text-5xl font-light leading-none text-gold-lt">
          {latest?.score ?? '—'}
        </p>
        <p className="pb-1 text-xs text-muted">/ 10</p>
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

      {/* Sparkline history */}
      {area.entries.length > 1 ? (
        <Sparkline entries={area.entries} />
      ) : (
        <p className="mb-5 text-xs italic text-muted">
          Log a couple more to see the line.
        </p>
      )}

      {/* New score input */}
      <div className="mt-5 border-t border-border-sub pt-5">
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
        <button
          type="button"
          onClick={() => onLog(area.id, draft)}
          className="mt-3 w-full rounded-sm border border-gold/45 bg-transparent px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
        >
          Save score
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   Inline SVG sparkline. Draws the entry history as a polyline.
   ============================================================ */

function Sparkline({ entries }: { entries: Entry[] }) {
  const w = 320;
  const h = 56;
  const padX = 4;
  const padY = 6;
  const min = 1;
  const max = 10;
  const n = entries.length;

  const points = entries.map((e, i) => {
    const x = padX + (i / (n - 1)) * (w - padX * 2);
    const y = h - padY - ((e.score - min) / (max - min)) * (h - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = entries[entries.length - 1];
  const lastX = padX + (w - padX * 2);
  const lastY = h - padY - ((last.score - min) / (max - min)) * (h - padY * 2);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-14 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Background grid hint */}
      <line
        x1={0}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke="rgba(201,165,72,0.1)"
        strokeDasharray="3 4"
      />
      {/* Filled area under the line */}
      <polygon
        points={`${padX},${h - padY} ${points.join(' ')} ${w - padX},${h - padY}`}
        fill="url(#sparkFill)"
        opacity={0.25}
      />
      {/* Line */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#c9a548"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
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
