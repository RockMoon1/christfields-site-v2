'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { markStageSeen } from '@/app/dashboard/(app)/prefs/actions';
import { STAGE_MOMENTS } from '@/lib/dashboard/foundations';
import type { JourneyStage } from '@/lib/dashboard/journey';

/**
 * The one quiet moment a member crosses into a new stage. A Scripture and a
 * whisper, shown once (the server advances journey_seen_stage on dismiss). The
 * stage is never named. Sacred and calm, never "you leveled up."
 *
 * The layout passes the newly reached stage as `stage`; null means nothing to
 * mark, so we render nothing.
 */
export function StageCrossing({ stage }: { stage: JourneyStage | null }) {
  const [open, setOpen] = useState<boolean>(Boolean(stage));
  const reduce = useReducedMotion();

  useEffect(() => {
    setOpen(Boolean(stage));
  }, [stage]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!stage) return null;
  const moment = STAGE_MOMENTS[stage];

  function close() {
    setOpen(false);
    // Advance-only on the server, so this moment never shows again.
    void markStageSeen(stage as JourneyStage);
  }

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="A moment"
        >
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(201,165,72,0.18) 0%, transparent 55%)',
            }}
          />

          <div className="relative mx-auto max-w-lg px-6 py-16 text-center">
            {reduce ? (
              <div className="mx-auto mb-8 h-1.5 w-1.5 rounded-full bg-gold" />
            ) : (
              <GrowthMotif />
            )}

            <motion.p
              {...fade(reduce ? 0.1 : 1.3)}
              className="mb-6 text-[11px] font-medium uppercase tracking-[0.28em] text-gold"
            >
              {moment.whisper}
            </motion.p>

            <motion.blockquote
              {...fade(reduce ? 0.2 : 1.5)}
              className="font-display text-2xl font-light italic leading-relaxed text-ivory md:text-3xl"
            >
              &ldquo;{moment.verse}&rdquo;
            </motion.blockquote>

            <motion.p
              {...fade(reduce ? 0.3 : 1.7)}
              className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold-lt"
            >
              {moment.ref}
            </motion.p>

            <motion.button
              {...fade(reduce ? 0.4 : 2.0)}
              type="button"
              onClick={close}
              className="mt-10 inline-flex items-center gap-2 rounded-sm border border-gold/50 px-7 py-3 text-xs font-medium uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Continue
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A seed opening: a stem draws up, leaves unfurl, a bloom of light at the top. */
function GrowthMotif() {
  return (
    <motion.svg viewBox="0 0 80 84" className="mx-auto mb-8 h-24 w-24" fill="none" aria-hidden>
      <motion.path
        d="M40 78 C 40 62 40 50 40 34"
        stroke="#c9a548"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />
      <motion.path
        d="M40 52 C 31 50 26 43 26 43 C 33 41 40 45 40 52Z"
        fill="#2d6a4f"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{ delay: 0.65, duration: 0.6 }}
        style={{ transformOrigin: '40px 52px' }}
      />
      <motion.path
        d="M40 56 C 49 54 54 47 54 47 C 47 45 40 49 40 56Z"
        fill="#2d6a4f"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{ transformOrigin: '40px 56px' }}
      />
      <motion.circle
        cx="40"
        cy="28"
        r="9"
        stroke="#e4c97a"
        strokeWidth="1.3"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.95, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '40px 28px' }}
      />
      <motion.circle
        cx="40"
        cy="28"
        r="3.5"
        fill="#f6df8f"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ delay: 1.2, duration: 0.7 }}
        style={{ transformOrigin: '40px 28px' }}
      />
    </motion.svg>
  );
}
