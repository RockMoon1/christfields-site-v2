'use client';

import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import { TextSplit } from '@/components/motion/TextSplit';
import { ScriptureSymbol } from '@/components/motion/ScriptureSymbol';

type ProseTag = 'p' | 'h2' | 'h3' | 'div';

interface ProseBlockProps {
  /** Which prose element to render. Default p. */
  as?: ProseTag;
  /** Pass-through id so h2 anchor links (scroll-mt) keep working. */
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Per-block reveal for journal prose. Each paragraph, heading, and quote
 * rises lightly into view as the reader reaches it, so long posts breathe
 * instead of rendering as one static wall. Deliberately gentle: small rise,
 * no blur, editorial easing — the motion acknowledges reading pace without
 * competing with the words. Reduced motion is honored through Motion's
 * site-wide MotionConfig.
 */
export function ProseBlock({ as = 'p', id, className, children }: ProseBlockProps) {
  const MotionEl = motion[as];

  return (
    <MotionEl
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </MotionEl>
  );
}

interface ScriptureQuoteProps {
  /** The verse text, character-for-character as authored in the MDX. */
  verse: string;
  /** The citation (e.g. "Proverbs 27:17"), exactly as authored. */
  citation?: string;
}

/**
 * The Scripture moment inside a journal post. The verse is the most
 * magnetic element on the page: a ✦ mark settles in, the verse arrives
 * word by word at reading pace (per-word masked rise — never a block
 * fade), the citation follows, and a gold hairline draws itself beneath
 * it. A faint gold glow holds the moment.
 *
 * Presentation only: the verse and citation strings are rendered verbatim.
 * TextSplit keeps the full text intact for assistive tech via aria-label.
 */
export function ScriptureQuote({ verse, citation }: ScriptureQuoteProps) {
  return (
    <blockquote className="relative my-14 px-2 py-6 text-center md:my-16 md:py-8">
      {/* Soft gold glow behind the verse. Decorative, fades in once. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--color-gold) 7%, transparent) 0%, transparent 70%)',
        }}
      />

      <ScriptureSymbol className="mb-5 inline-block text-2xl text-gold" />

      <p className="mx-auto max-w-xl font-display text-xl italic leading-relaxed text-ivory md:text-2xl">
        <TextSplit text={verse} by="word" mask delay={0.2} />
      </p>

      {citation && (
        <footer className="mt-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
          >
            <cite className="text-xs not-italic uppercase tracking-[0.18em] text-gold">
              {citation}
            </cite>
          </motion.div>
          {/* Self-drawing gold hairline beneath the citation. */}
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
            className="mx-auto mt-3 block h-px w-24 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
          />
        </footer>
      )}
    </blockquote>
  );
}
