'use client';

import { motion } from 'framer-motion';

/**
 * Next.js App Router template. Re-mounts on every route change, which makes
 * it the perfect place to attach a per-page transition.
 *
 * Two things happen on every navigation:
 *  1. A soft gold sweep wipes across the screen (the "scene change" feel).
 *  2. The new page fades up underneath the sweep, slightly delayed so the
 *     sweep is the first thing the eye catches.
 *
 * Both honor prefers-reduced-motion via Framer Motion's automatic handling.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Gold sweep overlay. Bell-curve gradient slides left-to-right across
          the viewport. Pointer-events disabled so clicks pass through. */}
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

      {/* Page content. Fades up after the sweep has begun to feel like the
          new scene is being revealed behind the gold wash. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.25,
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
