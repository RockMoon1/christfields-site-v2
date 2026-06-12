'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

/**
 * Whether the gold sweep has already played in this browser session.
 * Module scope survives client-side route changes (the template remounts,
 * the module does not) and resets on a full page load — exactly the
 * lifetime we want. It is only ever set inside a browser effect, so the
 * server bundle's copy stays false and SSR always renders the sweep,
 * matching the very first client render.
 */
let sweepPlayed = false;

/**
 * Next.js App Router template. Re-mounts on every route change.
 *
 * One job: sweep a soft gold gradient across the viewport on FIRST LOAD
 * only — an ignition, not wallpaper. It used to replay on every
 * navigation, stacking on the logo ignition and hero entrance and turning
 * the signature into noise after two clicks. Route changes now hand off
 * to component-level entrances (logo ignition, hero word stagger,
 * SectionHeader / Reveal section animations).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  // Captured once per mount with a pure initializer (Strict Mode safe).
  const [showSweep] = useState(() => !sweepPlayed);
  // Unmount the fixed full-viewport layer once the sweep finishes.
  const [sweepDone, setSweepDone] = useState(false);

  useEffect(() => {
    sweepPlayed = true;
  }, []);

  return (
    <>
      {showSweep && !sweepDone && (
        <motion.div
          aria-hidden
          initial={{ x: '-100%' }}
          animate={{ x: '110%' }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
          onAnimationComplete={() => setSweepDone(true)}
          className="pointer-events-none fixed inset-y-0 left-0 z-[150] w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(201, 165, 72, 0.0) 18%, rgba(228, 201, 122, 0.32) 50%, rgba(201, 165, 72, 0.0) 82%, transparent 100%)',
          }}
        />
      )}
      {children}
    </>
  );
}
