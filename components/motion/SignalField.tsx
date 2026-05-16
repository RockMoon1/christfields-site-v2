'use client';

import { motion, useReducedMotion } from 'motion/react';

interface SignalFieldProps {
  className?: string;
  intensity?: 'soft' | 'bright';
}

const traces = [
  { top: '18%', left: '-18%', width: '34%', delay: 0.2, duration: 7.8 },
  { top: '31%', left: '-26%', width: '48%', delay: 1.5, duration: 9.4 },
  { top: '52%', left: '-20%', width: '38%', delay: 3.1, duration: 8.8 },
  { top: '68%', left: '-30%', width: '52%', delay: 0.9, duration: 10.2 },
  { top: '82%', left: '-24%', width: '42%', delay: 4.2, duration: 9.6 },
];

const nodes = [
  { top: '24%', left: '19%', delay: 0.3 },
  { top: '39%', left: '72%', delay: 1.2 },
  { top: '58%', left: '34%', delay: 2.1 },
  { top: '75%', left: '61%', delay: 3 },
];

export function SignalField({ className = '', intensity = 'soft' }: SignalFieldProps) {
  const reduceMotion = useReducedMotion();
  const opacity = intensity === 'bright' ? 'opacity-70' : 'opacity-45';

  return (
    <div
      aria-hidden
      className={`pointer-events-none overflow-hidden ${className}`}
    >
      <div
        className={`absolute inset-0 ${opacity}`}
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,165,72,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(201,165,72,0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage:
            'radial-gradient(ellipse at 50% 38%, black 0%, rgba(0,0,0,0.72) 38%, transparent 75%)',
        }}
      />

      {traces.map((trace) => (
        <motion.span
          key={`${trace.top}-${trace.delay}`}
          className="absolute h-px rounded-full bg-gradient-to-r from-transparent via-gold-lt to-transparent"
          style={{ top: trace.top, left: trace.left, width: trace.width }}
          initial={{ x: '-20%', opacity: 0 }}
          animate={
            reduceMotion
              ? { opacity: 0.18 }
              : { x: ['-20%', '145%'], opacity: [0, 0.72, 0] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: trace.duration,
                  delay: trace.delay,
                  repeat: Infinity,
                  ease: 'linear',
                }
          }
        />
      ))}

      {nodes.map((node) => (
        <motion.span
          key={`${node.top}-${node.left}`}
          className="absolute h-1.5 w-1.5 rounded-sm border border-gold/70 bg-black-2 shadow-[0_0_16px_rgba(201,165,72,0.45)]"
          style={{ top: node.top, left: node.left }}
          animate={
            reduceMotion
              ? { opacity: 0.35 }
              : { opacity: [0.2, 0.9, 0.2], scale: [1, 1.35, 1] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 3.6,
                  delay: node.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        />
      ))}
    </div>
  );
}
