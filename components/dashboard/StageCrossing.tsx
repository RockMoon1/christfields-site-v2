'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { markStageSeen } from '@/app/dashboard/(app)/prefs/actions';
import { STAGE_MOMENTS, STAGE_UNLOCKS } from '@/lib/dashboard/foundations';
import type { JourneyStage } from '@/lib/dashboard/journey';

/**
 * The one moment a member crosses into a new stage. Two beats:
 *   1. A Scripture and a whisper (sacred, calm, the stage is never named).
 *   2. "Here is what just opened up" — the new sections as tappable cards.
 *
 * On continue, each card flies to its actual destination button in the nav and
 * is absorbed (stretched and shrunk, like spaghettification into a black hole),
 * and that button flares as it lands. On desktop the target is the sidebar
 * link; on mobile, where the items live inside the menu, the cards fly to the
 * hamburger. So the member literally watches where each new thing went.
 *
 * Shown once: the server advances journey_seen_stage on dismiss.
 */
export function StageCrossing({ stage }: { stage: JourneyStage | null }) {
  const [open, setOpen] = useState<boolean>(Boolean(stage));
  const [flights, setFlights] = useState<{ dx: number; dy: number; deg: number }[] | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const cardRefs = useRef<Array<HTMLLIElement | null>>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    setOpen(Boolean(stage));
    setFlights(null);
  }, [stage]);

  // The crossing animation is desktop-only. On phones the dashboard simply
  // updates to the new stage with no blocking overlay, so it never gets stuck.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDesktop(window.matchMedia('(min-width: 1024px)').matches);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const showing = open && isDesktop === true;
    document.body.style.overflow = showing ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, isDesktop]);

  if (!stage) return null;
  const moment = STAGE_MOMENTS[stage];
  const unlocks = STAGE_UNLOCKS[stage];

  function close() {
    setOpen(false);
    void markStageSeen(stage as JourneyStage);
  }

  /** Find the on-screen button a card should fly into. */
  function targetElFor(href: string): HTMLElement | null {
    const links = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-nav-href="${href}"]`),
    );
    const visible = links.find(
      (el) => el.offsetParent !== null && el.getBoundingClientRect().width > 0,
    );
    if (visible) return visible;
    return document.querySelector<HTMLElement>('[data-nav-burger]');
  }

  function flare(el: HTMLElement) {
    try {
      el.animate(
        [
          { boxShadow: '0 0 0px rgba(201,165,72,0)', backgroundColor: 'rgba(201,165,72,0)' },
          { boxShadow: '0 0 22px 5px rgba(201,165,72,0.9)', backgroundColor: 'rgba(201,165,72,0.22)' },
          { boxShadow: '0 0 0px rgba(201,165,72,0)', backgroundColor: 'rgba(201,165,72,0)' },
        ],
        { duration: 1200, easing: 'ease-out' },
      );
    } catch {
      /* WAAPI not available; ignore. */
    }
  }

  const STEP = 0.14; // stagger between cards, so each flight reads on its own

  function onContinue() {
    if (!unlocks) {
      close();
      return;
    }
    const computed = unlocks.items.map((it, i) => {
      const card = cardRefs.current[i];
      const target = targetElFor(it.href);
      if (!card) return { dx: 0, dy: 0, deg: 0 };
      const c = card.getBoundingClientRect();
      const t = target ? target.getBoundingClientRect() : new DOMRect(20, 20, 28, 28);
      const cx = c.left + c.width / 2;
      const cy = c.top + c.height / 2;
      const tx = t.left + t.width / 2;
      const ty = t.top + t.height / 2;
      const dx = tx - cx;
      const dy = ty - cy;
      // Flare the destination as this card arrives.
      if (target) window.setTimeout(() => flare(target), (i * STEP + 0.45) * 1000);
      return { dx, dy, deg: (Math.atan2(dy, dx) * 180) / Math.PI };
    });
    setFlights(computed);
    const last = (unlocks.items.length - 1) * STEP;
    window.setTimeout(close, (last + 0.95) * 1000);
  }

  return (
    <AnimatePresence>
      {open && isDesktop === true && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[110] overflow-y-auto bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="A moment"
        >
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 38%, rgba(201,165,72,0.18) 0%, transparent 55%)',
            }}
          />

          <div className="relative flex min-h-full items-center justify-center">
            <div className="w-full max-w-lg px-6 py-16 text-center">
            {/* Beat 1 — the sacred moment. Fades as the cards begin to fly. */}
            <motion.div animate={{ opacity: flights ? 0 : 1 }} transition={{ duration: 0.4 }}>
              {reduce ? (
                <div className="mx-auto mb-8 h-1.5 w-1.5 rounded-full bg-gold" />
              ) : (
                <GrowthMotif />
              )}

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: reduce ? 0.05 : 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6 text-[11px] font-medium uppercase tracking-[0.28em] text-gold"
              >
                {moment.whisper}
              </motion.p>

              <motion.blockquote
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: reduce ? 0.1 : 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-2xl font-light italic leading-relaxed text-ivory md:text-3xl"
              >
                &ldquo;{moment.verse}&rdquo;
              </motion.blockquote>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: reduce ? 0.15 : 1.55, ease: [0.22, 1, 0.36, 1] }}
                className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold-lt"
              >
                {moment.ref}
              </motion.p>
            </motion.div>

            {/* Beat 2 — what just opened up. */}
            {unlocks && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: reduce ? 0.2 : 1.8 }}
                className="mt-10 border-t border-border-sub pt-8"
              >
                {/* Title + intro fade as the cards begin to fly; the cards
                    themselves manage their own absorb so they stay visible. */}
                <motion.div animate={{ opacity: flights ? 0 : 1 }} transition={{ duration: 0.4 }}>
                  <p className="mb-1 font-display text-xl font-light text-ivory">{unlocks.title}</p>
                  <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-silver">
                    {unlocks.intro}
                  </p>
                </motion.div>

                <ul className="flex flex-col gap-2 text-left">
                  {unlocks.items.map((it, i) => (
                    <motion.li
                      key={it.href + it.label}
                      ref={(el) => {
                        cardRefs.current[i] = el;
                      }}
                      initial={{ opacity: 0, x: -14 }}
                      animate={
                        flights
                          ? reduce
                            ? {
                                // Gentler absorb for reduced-motion: move + shrink + fade,
                                // no wild stretch, but still flies to the button.
                                x: flights[i].dx,
                                y: flights[i].dy,
                                scale: 0.2,
                                opacity: [1, 1, 0],
                              }
                            : {
                                x: flights[i].dx,
                                y: flights[i].dy,
                                rotate: flights[i].deg,
                                scaleX: [1, 1.35, 0.03],
                                scaleY: [1, 0.45, 0.03],
                                opacity: [1, 1, 0],
                              }
                          : { opacity: 1, x: 0 }
                      }
                      transition={
                        flights
                          ? {
                              duration: reduce ? 0.7 : 0.8,
                              ease: reduce ? 'easeInOut' : [0.6, 0, 0.85, 0],
                              delay: i * STEP,
                            }
                          : { delay: (reduce ? 0.25 : 2.0) + i * 0.12, duration: 0.5 }
                      }
                      style={{ transformOrigin: 'center', willChange: 'transform' }}
                    >
                      <Link
                        href={it.href}
                        onClick={close}
                        className="group flex items-start gap-3 rounded-sm border border-border-gold bg-gold/[0.06] px-4 py-3 transition-colors hover:bg-gold/[0.12]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/60 text-[10px] text-gold-lt">
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gold-lt">{it.label}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-silver">{it.note}</span>
                        </span>
                        <span className="ml-auto self-center text-gold opacity-0 transition-opacity group-hover:opacity-100">
                          &rarr;
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            <motion.button
              animate={{ opacity: flights ? 0 : 1 }}
              transition={{ duration: 0.3, delay: flights ? 0 : reduce ? 0.3 : 2.4 }}
              type="button"
              onClick={onContinue}
              disabled={Boolean(flights)}
              className="mt-9 inline-flex items-center gap-2 rounded-sm border border-gold/50 px-7 py-3 text-xs font-medium uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Continue
            </motion.button>
            </div>
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
