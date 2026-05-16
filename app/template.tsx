'use client';

import { motion } from 'motion/react';

/**
 * Next.js App Router template. Re-mounts on every route change.
 *
 * One job: sweep a soft gold gradient across the viewport as the page
 * changes. The new page renders directly behind the sweep with no extra
 * fade-up wrapper, so the nav links (and anything else that shouldn't have
 * its own entrance animation) don't double up with their own children's
 * animations. Component-level animations like the logo ignition, the hero
 * word stagger, and the Reveal-based section animations handle the rest.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        initial={{ x: '-100%' }}
        animate={{ x: '110%' }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        className="pointer-events-none fixed inset-y-0 left-0 z-[150] w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(201, 165, 72, 0.0) 18%, rgba(228, 201, 122, 0.32) 50%, rgba(201, 165, 72, 0.0) 82%, transparent 100%)',
        }}
      />
      {children}
    </>
  );
}
