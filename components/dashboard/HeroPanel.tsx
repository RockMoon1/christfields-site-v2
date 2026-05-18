'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface HeroPanelProps {
  children: ReactNode;
}

/**
 * The dashboard overview hero card, alive. Wraps its children with:
 *  - two slow-drifting MorphBlobs in the background for ambient color
 *  - a cursor-tracked accent glow that follows the pointer across the card
 *  - a subtle breathing animation on the whole panel
 *  - a slow entrance animation
 *  - animated top and bottom hairlines that pulse
 */
export function HeroPanel({ children }: HeroPanelProps) {
  const isMobile = useIsMobile();
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const springX = useSpring(mouseX, { stiffness: 180, damping: 26 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 26 });
  const [active, setActive] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    if (isMobile) return; // touch devices don't hover
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !isMobile && setActive(true)}
      onMouseLeave={() => !isMobile && setActive(false)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mb-12 overflow-hidden rounded-sm border border-border-sub bg-gradient-to-br from-black-3 to-black-2"
    >
      {/* Ambient morphing blobs hidden on mobile — the blur filter is the
          single most expensive CSS effect on phones. */}
      {!isMobile && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <MorphBlob
            color="rgba(201, 165, 72, 0.07)"
            size={520}
            className="-left-32 -top-32"
          />
          <MorphBlob
            color="rgba(45, 106, 79, 0.08)"
            size={460}
            className="-bottom-24 right-10"
          />
        </div>
      )}

      {/* Cursor-tracking accent glow — desktop only. */}
      {!isMobile && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: springX,
            top: springY,
            background:
              'radial-gradient(circle, rgba(201,165,72,0.18), transparent 60%)',
            mixBlendMode: 'plus-lighter',
            opacity: active ? 1 : 0,
            transition: 'opacity 350ms ease',
          }}
        />
      )}

      {/* Top hairline that pulses — cheap on any device. */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bottom hairline that pulses out of phase */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        animate={{ opacity: [0.2, 0.55, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}
