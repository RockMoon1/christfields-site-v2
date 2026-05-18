'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
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
 * Self-tracked progress areas with 1-10 scoring and a sparkline.
 *
 * Reads its initial state from server-rendered props (passed by the page)
 * and uses server actions for every mutation. After each action, the page
 * re-revalidates and we update local state optimistically for snappy UX.
 */
export function ProgressBoard({ initialAreas }: ProgressBoardProps) {
  const [areas, setAreas] = useState<AreaWithEntries[]>(initialAreas);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const name = newName.trim();
    const description = newDesc.trim();

    // Optimistic insert with a temporary id. The temp id gets replaced with
    // the real database id once createArea returns.
    const tempId = `temp-${Date.now()}`;
    setAreas((prev) => [...prev, { id: tempId, name, description, entries: [] }]);
    setNewName('');
    setNewDesc('');
    setShowAdd(false);

    startTransition(async () => {
      try {
        const realArea = await createArea(name, description);
        // Swap the temp row out for the real one (correct id from server).
        setAreas((prev) => prev.map((a) => (a.id === tempId ? realArea : a)));
      } catch (err) {
        // Roll back the optimistic insert
        setAreas((prev) => prev.filter((a) => a.id !== tempId));
        alert('Could not save area. Please try again.');
        console.error(err);
      }
    });
  }

  function handleLog(areaId: string, score: number) {
    // If the user clicks Save before the area finishes saving on the server,
    // the id is still a temp id and the database does not know about it yet.
    if (areaId.startsWith('temp-')) {
      alert('Hold on a second, that area is still being saved. Try again in a moment.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    // Optimistic append
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, entries: [...a.entries, { score, date: today }] }
          : a,
      ),
    );

    startTransition(async () => {
      try {
        await logScore(areaId, score);
      } catch (err) {
        // Roll back optimistic entry
        setAreas((prev) =>
          prev.map((a) =>
            a.id === areaId
              ? { ...a, entries: a.entries.slice(0, -1) }
              : a,
          ),
        );
        alert('Could not save score. Please try again.');
        console.error(err);
      }
    });
  }

  function handleRemove(areaId: string) {
    // Temp areas are not yet on the server. Just drop them locally.
    if (areaId.startsWith('temp-')) {
      setAreas((prev) => prev.filter((a) => a.id !== areaId));
      return;
    }

    // Optimistic remove
    const removed = areas.find((a) => a.id === areaId);
    setAreas((prev) => prev.filter((a) => a.id !== areaId));

    startTransition(async () => {
      try {
        await deleteArea(areaId);
      } catch (err) {
        // Roll back
        if (removed) setAreas((prev) => [...prev, removed]);
        alert('Could not remove area. Please try again.');
        console.error(err);
      }
    });
  }

  return (
    <div>
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
              <AreaCard area={area} onLog={handleLog} onRemove={handleRemove} />
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div layout>
          {showAdd ? (
            <form
              onSubmit={handleAdd}
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
                maxLength={100}
                className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="One short sentence about what this area means to you."
                rows={2}
                maxLength={500}
                className="rounded-sm border border-border-sub bg-black-2 px-3 py-2 text-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
              />
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-sm bg-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt disabled:opacity-70"
                >
                  {isPending ? 'Saving...' : 'Add'}
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

interface AreaCardProps {
  area: AreaWithEntries;
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
          {area.description && (
            <p className="text-xs text-silver">{area.description}</p>
          )}
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

      {area.entries.length > 1 ? (
        <Sparkline entries={area.entries} />
      ) : (
        <p className="mb-5 text-xs italic text-muted">
          Log a couple more to see the line.
        </p>
      )}

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

function Sparkline({ entries }: { entries: { score: number; date: string }[] }) {
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
      <line
        x1={0}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke="rgba(201,165,72,0.1)"
        strokeDasharray="3 4"
      />
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
