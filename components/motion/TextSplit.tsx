'use client';

import { motion, type Variants } from 'motion/react';

interface TextSplitProps {
  /** The text to animate character by character. */
  text: string;
  /** Optional className for the wrapper span. */
  className?: string;
  /** Delay before the animation starts (seconds). */
  delay?: number;
  /** Whether each character should have a blur-in effect. */
  blur?: boolean;
}

const container: Variants = {
  hidden: {},
  visible: (delay: number) => ({
    transition: { staggerChildren: 0.035, delayChildren: delay },
  }),
};

const charVariant: Variants = {
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

/**
 * Animates text character-by-character with optional blur-in.
 * Preserves spaces between words. Great for hero headings.
 */
export function TextSplit({ text, className = '', delay = 0, blur = true }: TextSplitProps) {
  const chars = text.split('');

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      custom={delay}
      variants={container}
      className={`inline-block ${className}`}
      aria-label={text}
    >
      {chars.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          custom={blur}
          variants={charVariant}
          className="inline-block"
          aria-hidden
          style={char === ' ' ? { width: '0.3em' } : undefined}
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
