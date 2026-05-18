'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { MorphBlob } from '@/components/motion/MorphBlob';

interface HeroPanelProps {
  children: ReactNode;
}

/**
 * The dashboard overview hero card. Wraps its children with:
 *  - two slow-drifting MorphBlobs in the background (hidden on mobile via CSS)
 *  - a cursor-tracked accent glow (hidden on touch devices via CSS)
 *  - a subtle entrance animation
 *  - animated top and bottom hairlines that pulse
 *
 * IMPORTANT: this component intentionally does NOT use useIsMobile. The
 * combination of conditional renders driven by a useEffect-set state and the
 * Suspense boundary in the dashboard's WebGL canvas was causing React error
 * 300 on narrow viewports. Now everything renders unconditionally and is
 * gated purely by Tailwind responsive classes (hidden md:block) and the
 * @media (hover: hover) implicit behavior of mousemove on touch devices.
 */
export function HeroPanel({ children }: HeroPanelProps) {
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const springX = useSpring(mouseX, { stiffness: 180, damping: 26 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 26 });
  const [active, setActive] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mb-12 overflow-hidden rounded-sm border border-border-sub bg-gradient-to-br from-black-3 to-black-2"
    >
      {/* Ambient morphing blobs. Hidden under md breakpoint via Tailwind
          because the 60px blur is expensive on phones. */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
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

      {/* Cursor-tracking accent glow. Hidden under md via Tailwind so touch
          devices (which do not hover) never render the costly radial gradient. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute hidden h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full md:block"
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
