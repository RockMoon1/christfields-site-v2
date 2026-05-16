'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LogoProps {
  /** Size of the logo image in pixels. Nav uses 72, footer uses 56. */
  size?: number;
  /** Whether to show the text fallback alongside */
  showText?: boolean;
  /** Optional className for outer wrapper */
  className?: string;
}

/**
 * The Christ Fields flame logo with animated glow and floating embers.
 * Ports the .logo-fire-wrap pattern from the v1 site verbatim so the
 * fire animation feels identical.
 *
 * On mount, the flame ignites: the logo scales in from slightly smaller,
 * brightness pulses high then settles, and a brief gold drop-shadow flares.
 * Subtle enough to not feel repetitive on subsequent page navigations,
 * intentional enough to "wake up" the brand each time the logo renders.
 */
export function Logo({ size = 72, showText = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div
        className="logo-fire-wrap"
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.78 }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: [
            'brightness(0.4)',
            'brightness(2) drop-shadow(0 0 18px rgba(201, 165, 72, 0.8))',
            'brightness(1) drop-shadow(0 0 0 transparent)',
          ],
        }}
        transition={{
          opacity: { duration: 0.45, ease: 'easeOut' },
          scale: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
          filter: { duration: 1.1, times: [0, 0.45, 1], ease: 'easeOut' },
        }}
      >
        <div className="logo-fire-glow" />
        <div className="logo-fire-glow2" />
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`logo-ember logo-ember-${i + 3}`} />
        ))}
        <Image
          src="/assets/logo.png"
          alt="Christ Fields"
          width={size}
          height={size}
          priority
          sizes={`${size}px`}
          className="logo-fire-img relative z-[2]"
          style={{ width: size, height: 'auto' }}
        />
      </motion.div>
      {showText && (
        <span className="font-display text-[1.3rem] font-medium tracking-wide text-ivory">
          Christ Fields
        </span>
      )}
    </div>
  );
}
