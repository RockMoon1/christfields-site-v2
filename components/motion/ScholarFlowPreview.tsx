'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const focusRows = [
  { label: 'Deep study block', value: '78%', color: 'from-gold to-gold-lt' },
  { label: 'Distraction guard', value: '64%', color: 'from-emerald-lt to-gold' },
  { label: 'Weekly discipline', value: '86%', color: 'from-gold-lt to-emerald-lt' },
];

const TASKS = [
  { title: 'Research summary', time: '8:30 AM' },
  { title: 'Scripture reflection', time: '11:00 AM' },
  { title: 'Focused writing', time: '2:15 PM' },
];

const TASK_STATES = ['Next', 'Ready', 'Active', 'Done'] as const;
type TaskState = (typeof TASK_STATES)[number];

/**
 * Mock ScholarFlow dashboard, now clickable (moved to /scholarflow's preview
 * section 2026-08-09). Tap a task to walk it through Next -> Ready -> Active
 * -> Done; all state is local, nothing is tracked or saved. Keeps the
 * signature idle beats (sweeping light bar, progress fills, radar-pulse AI
 * halo) on the family's glass material. Product labels stay verbatim.
 */
export function ScholarFlowPreview() {
  const reduceMotion = useReducedMotion();
  const [taskStates, setTaskStates] = useState<TaskState[]>(['Active', 'Ready', 'Next']);

  function cycleTask(i: number) {
    setTaskStates((prev) =>
      prev.map((s, j) =>
        j === i ? TASK_STATES[(TASK_STATES.indexOf(s) + 1) % TASK_STATES.length] : s,
      ),
    );
  }

  return (
    <div className="cf-glass relative overflow-hidden rounded-md p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(201,165,72,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(201,165,72,0.04)_1px,transparent_1px)] bg-[size:38px_38px] opacity-60"
      />

      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-lt to-transparent"
        animate={
          reduceMotion
            ? { opacity: 0.4 }
            : { opacity: [0.18, 0.9, 0.18], x: ['-24%', '24%', '-24%'] }
        }
        transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-border-sub pb-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
              ScholarFlow
            </p>
            <h3 className="font-display text-2xl font-light text-ivory">
              Focus Command
            </h3>
          </div>
          <div className="relative h-12 w-12">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full border border-gold/40"
              animate={
                reduceMotion ? { opacity: 0.25 } : { scale: [1, 1.45], opacity: [0.4, 0] }
              }
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-xs font-semibold text-gold-lt"
              animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              AI
            </motion.div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-sm border border-border-sub bg-black/35 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.16em] text-silver">
                Today
              </span>
              <span className="rounded-sm border border-emerald-lt/35 bg-emerald-lt/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-bright">
                On Track
              </span>
            </div>

            <div className="space-y-3">
              {focusRows.map((row, i) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span className="text-ivory-dim">{row.label}</span>
                    <span className="font-medium text-gold-lt">{row.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black-4">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                      initial={{ width: '12%' }}
                      whileInView={{ width: row.value }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, delay: 0.15 + i * 0.12 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {TASKS.map((task, i) => (
              <motion.button
                key={task.title}
                onClick={() => cycleTask(i)}
                className="group block w-full rounded-sm border border-border-sub bg-black/30 p-3 text-left transition-colors hover:border-border-gold"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.1 + i * 0.08 }}
                whileHover={reduceMotion ? undefined : { x: 4 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        taskStates[i] === 'Done' ? 'text-ivory-dim line-through' : 'text-ivory'
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-muted">{task.time}</p>
                  </div>
                  <span
                    className={`rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      taskStates[i] === 'Done'
                        ? 'border-emerald-lt/35 bg-emerald-lt/15 text-emerald-bright'
                        : taskStates[i] === 'Active'
                          ? 'border-gold/45 bg-gold/20 text-gold-lt'
                          : 'border-gold/25 bg-gold/10 text-gold'
                    }`}
                  >
                    {taskStates[i]}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.div
          className="mt-4 rounded-sm border border-gold/20 bg-gold/[0.06] p-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-gold">
            Guidance
          </p>
          <p className="text-sm leading-relaxed text-ivory-dim">
            Protect the next deep work block. Keep the plan simple, finish one task, then review.
          </p>
        </motion.div>

        <p className="mt-4 text-[11px] text-muted">
          A small preview to click around. Tap a task to move it along. Nothing here is tracked or
          saved.
        </p>
      </div>
    </div>
  );
}
