'use client';

import { motion } from 'motion/react';

interface SuccessCheckProps {
  /** Size of the circle in px. */
  size?: number;
  className?: string;
}

/**
 * Animated checkmark inside a circle. The circle draws itself, then the
 * check draws in, then a subtle pulse rings out. Used for form success states.
 */
export function SuccessCheck({ size = 64, className = '' }: SuccessCheckProps) {
  const r = size / 2 - 4;
  const circumference = 2 * Math.PI * r;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Pulse ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.6, opacity: [0, 0.4, 0] }}
        transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
        className="absolute rounded-full border border-gold"
        style={{ width: size, height: size }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        {/* Circle outline draws in */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={2}
          className="text-gold"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Checkmark draws in after circle */}
        <motion.path
          d={`M${size * 0.28} ${size * 0.52} L${size * 0.44} ${size * 0.66} L${size * 0.72} ${size * 0.36}`}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gold"
          pathLength={0}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}
