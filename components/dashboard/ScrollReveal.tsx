'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useDesktopFx } from '@/lib/hooks/useDesktopFx';

/**
 * Reveals its children with a fade-and-rise as they scroll into view, but only
 * on a capable computer. On phones and low-powered machines it renders the
 * children plainly (no scroll dependency), so nothing is ever hidden waiting
 * for an animation that should not run there.
 *
 * Wrap only static, non-interactive sections: when desktop FX turns on after
 * mount this swaps to a motion wrapper, which remounts the subtree.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const fx = useDesktopFx();

  if (!fx) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 38 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
