'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { useDesktopFx } from '@/lib/hooks/useDesktopFx';

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
  const fx = useDesktopFx();
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const springX = useSpring(mouseX, { stiffness: 180, damping: 26 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 26 });
  const [active, setActive] = useState(false);

  // Desktop-only 3D tilt of the whole hero plane, plus background parallax that
  // moves opposite the cursor for depth. Springs keep it smooth; values stay at
  // 0 on phones and low-powered machines, so the card is simply flat there.
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const tiltX = useSpring(rotX, { stiffness: 150, damping: 18 });
  const tiltY = useSpring(rotY, { stiffness: 150, damping: 18 });
  const parX = useMotionValue(0);
  const parY = useMotionValue(0);
  const blobX = useSpring(parX, { stiffness: 120, damping: 24 });
  const blobY = useSpring(parY, { stiffness: 120, damping: 24 });

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
    if (!fx) return; // tilt + parallax only on a capable computer
    const nx = x / rect.width - 0.5;
    const ny = y / rect.height - 0.5;
    rotY.set(nx * 7);
    rotX.set(ny * -7);
    parX.set(nx * -30);
    parY.set(ny * -30);
  }

  function resetTilt() {
    rotX.set(0);
    rotY.set(0);
    parX.set(0);
    parY.set(0);
  }

  return (
    <motion.section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => {
        setActive(false);
        resetTilt();
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mb-12 overflow-hidden rounded-sm border border-border-sub bg-gradient-to-br from-black-3 to-black-2"
    >
      {/* Ambient morphing blobs. Hidden under md breakpoint via Tailwind
          because the 60px blur is expensive on phones. On desktop they drift
          with the cursor (parallax) for depth. */}
      <motion.div
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
        style={{ x: blobX, y: blobY }}
      >
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
      </motion.div>

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

      <motion.div
        className="relative z-10"
        style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1100 }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}
