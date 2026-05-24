'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { markWelcomeSeen } from '@/app/dashboard/(app)/prefs/actions';
import { WELCOME } from '@/lib/dashboard/foundations';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

/**
 * The one-time welcome a member meets on first sign-in. Shown only when their
 * prefs row has welcome_seen = false; the layout decides whether to mount it.
 * Warm and unhurried: a personal hello, a welcome for anyone still deciding
 * what they believe, one honest word about surrender, then a step in.
 */
export function WelcomeOverlay({ firstName }: { firstName?: string }) {
  const [open, setOpen] = useState(true);
  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function enter() {
    setOpen(false);
    startTransition(async () => {
      await markWelcomeSeen();
    });
  }

  // Contain focus in the dialog, restore it on close, and dismiss on Escape.
  useFocusTrap(dialogRef, open, enter);

  const item = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Christ Fields"
        >
          {/* Ambient light */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% -5%, rgba(201,165,72,0.16) 0%, transparent 55%), radial-gradient(ellipse at 50% 110%, rgba(27,67,50,0.18) 0%, transparent 55%)',
            }}
          />

          <div className="relative mx-auto flex min-h-full max-w-2xl flex-col justify-center px-6 py-16">
            <motion.div
              aria-hidden
              {...item(0.05)}
              className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent"
            />

            <motion.p
              {...item(0.1)}
              className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-gold"
            >
              {WELCOME.eyebrow}
            </motion.p>

            <motion.h1
              {...item(0.18)}
              className="mb-8 text-center font-display text-4xl font-light leading-tight text-ivory md:text-5xl"
            >
              {firstName ? `${firstName}, you are welcome here.` : WELCOME.heading}
            </motion.h1>

            <motion.p {...item(0.28)} className="mb-5 text-base leading-relaxed text-silver md:text-lg">
              {WELCOME.fromLisandro}
            </motion.p>

            <motion.p {...item(0.36)} className="mb-8 text-base leading-relaxed text-silver md:text-lg">
              {WELCOME.seeker}
            </motion.p>

            <motion.div
              {...item(0.46)}
              className="mb-8 rounded-sm border-l-2 border-gold/70 bg-black-3/70 px-5 py-4"
            >
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-gold-lt">
                {WELCOME.teaching.title}
              </p>
              <p className="text-sm leading-relaxed text-ivory-dim md:text-base">
                {WELCOME.teaching.body}
              </p>
            </motion.div>

            <motion.figure {...item(0.54)} className="mb-8 text-center">
              <blockquote className="font-display text-xl font-light italic leading-relaxed text-ivory md:text-2xl">
                &ldquo;{WELCOME.verse.text}&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-[11px] uppercase tracking-[0.18em] text-gold">
                {WELCOME.verse.ref}
              </figcaption>
            </motion.figure>

            <motion.p {...item(0.62)} className="mb-10 text-center text-sm leading-relaxed text-muted">
              {WELCOME.close}
            </motion.p>

            <motion.div {...item(0.72)} className="flex justify-center">
              <button
                type="button"
                onClick={enter}
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-8 py-3.5 text-xs font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-gold-lt"
              >
                {WELCOME.cta} &rarr;
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
