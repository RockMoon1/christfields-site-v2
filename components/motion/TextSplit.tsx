'use client';

import { motion, type Variants } from 'motion/react';

interface TextSplitProps {
  /** The text to animate. */
  text: string;
  /** Optional className for the wrapper span. */
  className?: string;
  /** Delay before the animation starts (seconds). */
  delay?: number;
  /** Whether each token should have a blur-in effect (char mode only). */
  blur?: boolean;
  /**
   * Split granularity.
   * - 'char': every character rises individually (original behavior).
   * - 'word': whole words rise — calmer, better for scripture and ledes.
   */
  by?: 'char' | 'word';
  /**
   * Masked mode: each token rises out of an overflow-hidden clip instead of
   * fading through blur. Reads as an editorial "line wipe". Words never break
   * mid-word because each word span is whitespace-nowrap.
   */
  mask?: boolean;
  /** Seconds between each token. Defaults tuned per mode. */
  stagger?: number;
}

const container: Variants = {
  hidden: {},
  visible: (custom: { delay: number; stagger: number }) => ({
    transition: { staggerChildren: custom.stagger, delayChildren: custom.delay },
  }),
};

const fadeToken: Variants = {
  hidden: (blur: boolean) => ({
    opacity: 0,
    y: 20,
    filter: blur ? 'blur(8px)' : 'blur(0px)',
  }),
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const maskToken: Variants = {
  hidden: { y: '110%' },
  visible: {
    y: '0%',
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Animates text token-by-token. Char mode for hero display type, word mode
 * for scripture and ledes (verses arrive word by word at reading pace —
 * never blur-fading as a block). Mask mode clips each token so it rises
 * out of its own line like a letterpress wipe.
 *
 * The full text stays intact for assistive tech via aria-label; tokens are
 * aria-hidden. The underlying string is never altered.
 */
export function TextSplit({
  text,
  className = '',
  delay = 0,
  blur = true,
  by = 'char',
  mask = false,
  stagger,
}: TextSplitProps) {
  const tokens = by === 'word' ? text.split(/(\s+)/).filter((t) => t.length > 0) : text.split('');
  const gap = stagger ?? (by === 'word' ? 0.055 : 0.035);

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      custom={{ delay, stagger: gap }}
      variants={container}
      className={`inline-block ${className}`}
      aria-label={text}
    >
      {tokens.map((token, i) => {
        const isSpace = /^\s+$/.test(token);
        if (isSpace) {
          return (
            <span key={`s-${i}`} aria-hidden>
              {' '}
            </span>
          );
        }
        if (mask) {
          return (
            <span
              key={`${token}-${i}`}
              aria-hidden
              className="inline-block overflow-hidden align-bottom"
              style={{ whiteSpace: 'nowrap' }}
            >
              <motion.span variants={maskToken} className="inline-block will-change-transform">
                {token}
              </motion.span>
            </span>
          );
        }
        return (
          <motion.span
            key={`${token}-${i}`}
            custom={blur}
            variants={fadeToken}
            className="inline-block"
            aria-hidden
            style={by === 'char' && token === ' ' ? { width: '0.3em' } : { whiteSpace: 'nowrap' }}
          >
            {by === 'char' && token === ' ' ? ' ' : token}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
