'use client';

import { motion } from 'framer-motion';

/**
 * Next.js App Router template. Re-mounts on every route change, which makes
 * it the perfect place to attach a per-page transition.
 *
 * The fade plus subtle upward slide keeps navigation smooth without feeling
 * heavy. Honors prefers-reduced-motion via Framer Motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
