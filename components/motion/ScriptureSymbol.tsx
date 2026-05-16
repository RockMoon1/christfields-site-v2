'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

interface ScriptureSymbolProps {
  /** Symbol to render. Defaults to the gold star used across the site. */
  symbol?: string;
  /** Extra className for layout, text size, color, and spacing. */
  className?: string;
  /** Delay in seconds before the animation begins. */
  delay?: number;
}

export function ScriptureSymbol({
  symbol = '\u2726',
  className = '',
  delay = 0,
}: ScriptureSymbolProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={className}
      initial={{ opacity: 0, y: 12, scale: 0.9, filter: 'brightness(0.5)' }}
      animate={
        inView
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: [
                'brightness(0.5)',
                'brightness(2.2) drop-shadow(0 0 14px #C9A548)',
                'brightness(1) drop-shadow(0 0 0px transparent)',
              ],
            }
          : undefined
      }
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        filter: { duration: 1.4, delay: delay + 0.3, times: [0, 0.4, 1] },
      }}
      style={{ display: 'inline-block' }}
    >
      {symbol}
    </motion.span>
  );
}
