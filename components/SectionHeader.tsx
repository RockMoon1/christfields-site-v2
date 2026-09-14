'use client';

import { useReducedMotion } from '@/lib/use-reduced-motion';

import { motion, useInView } from 'motion/react';
import { type ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  /** Small uppercase gold label above the heading. */
  eyebrow?: string;
  /**
   * The heading content. Supports the family's typographic signature —
   * a gold-italic <em> word inside the serif heading. Pass JSX freely;
   * the whole heading rises out of a mask as one piece.
   */
  title: ReactNode;
  /** Optional lede paragraph under the heading. */
  lede?: ReactNode;
  /** Text alignment. Default center. */
  align?: 'center' | 'left';
  /** Heading level for document outline. Default h2. */
  as?: 'h1' | 'h2' | 'h3';
  /** Extra classes on the outer wrapper (margins etc). */
  className?: string;
  /** Extra classes on the heading element (size overrides). */
  titleClassName?: string;
  /** Extra classes on the lede. */
  ledeClassName?: string;
}

/**
 * The one section header for the whole site, replacing the ten copy-pasted
 * eyebrow → heading → lede blocks. Owning the entrance in one place gives
 * every section the same *signature* without the same *sameness*:
 *
 * 1. the eyebrow's gold rule draws itself in (scaleX),
 * 2. the heading rises out of an overflow-hidden mask (letterpress wipe),
 * 3. any gold <em> inside the heading catches a one-shot shimmer
 *    (`.cf-em-shimmer` in globals.css) after it settles.
 *
 * Reduced motion presents every element immediately; CSS also keeps the
 * server-rendered content visible before hydration.
 */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = 'center',
  as: Heading = 'h2',
  className = '',
  titleClassName = '',
  ledeClassName = '',
}: SectionHeaderProps) {
  const reduceMotion = useReducedMotion();
  const headingMaskRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingMaskRef, { once: true, margin: '0px 0px -10% 0px' });
  const centered = align === 'center';
  const MotionHeading = motion[Heading];

  return (
    <div className={cn(centered ? 'text-center' : 'text-left', className)}>
      {eyebrow && (
        <div
          className={cn(
            'mb-5 flex items-center gap-3',
            centered && 'justify-center',
          )}
        >
          <motion.span
            aria-hidden
            data-motion-reveal
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={reduceMotion ? { scaleX: 1 } : undefined}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: centered ? 'right center' : 'left center' }}
            className="h-px w-8 bg-gradient-to-r from-transparent to-gold/70"
          />
          <motion.p
            data-motion-reveal
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.15 }}
            className="font-body text-meta font-medium uppercase tracking-[0.2em] text-gold"
          >
            {eyebrow}
          </motion.p>
          <motion.span
            aria-hidden
            data-motion-reveal
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={reduceMotion ? { scaleX: 1 } : undefined}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'left center' }}
            className={cn(
              'h-px w-8 bg-gradient-to-l from-transparent to-gold/70',
              !centered && 'hidden',
            )}
          />
        </div>
      )}

      {/* Observe the stationary mask: the heading starts entirely outside its
          clipped bounds, so observing the heading itself never triggers. */}
      <div ref={headingMaskRef} className="overflow-hidden">
        <MotionHeading
          data-motion-reveal
          initial={reduceMotion ? false : { y: '105%' }}
          animate={{ y: reduceMotion || headingInView ? '0%' : '105%' }}
          transition={{ duration: reduceMotion ? 0 : 0.95, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.1 }}
          className={cn(
            'cf-heading-shimmer font-display text-display-md font-light text-ivory',
            titleClassName,
          )}
        >
          {title}
        </MotionHeading>
      </div>

      {lede && (
        <motion.div
          data-motion-reveal
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.35 }}
          className={cn(
            'mt-5 max-w-2xl text-base leading-relaxed text-ivory-dim md:text-lg',
            centered && 'mx-auto',
            ledeClassName,
          )}
        >
          {lede}
        </motion.div>
      )}
    </div>
  );
}
