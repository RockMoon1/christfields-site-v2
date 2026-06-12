'use client';

import Link from 'next/link';
import { useReducedMotion } from 'motion/react';
import { type ReactNode, type MouseEvent, useCallback } from 'react';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: ReactNode;
  /** Renders a Next link when href is given, otherwise a button element. */
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost';
  /**
   * Fire a one-shot ember burst from the button on click. Reserve this for
   * moments of commitment (Join, Save, Submit) — fire is a response, not
   * wallpaper.
   */
  emberBurst?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** Spawns a short-lived radial spark burst at a point. Pure DOM + CSS so it
 *  costs nothing while idle; respects reduced motion by not firing. */
function burstAt(x: number, y: number) {
  const host = document.createElement('div');
  host.className = 'cf-burst';
  host.style.left = `${x}px`;
  host.style.top = `${y}px`;
  host.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
    const dist = 26 + Math.random() * 30;
    s.style.setProperty('--bx', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--by', `${Math.sin(angle) * dist - 14}px`);
    s.style.setProperty('--bd', `${0.55 + Math.random() * 0.35}s`);
    s.style.background = i % 3 === 0 ? '#e4c97a' : i % 3 === 1 ? '#ffb830' : '#c9a548';
    host.appendChild(s);
  }
  document.body.appendChild(host);
  window.setTimeout(() => host.remove(), 1100);
}

/**
 * The one CTA for the whole site: gold sheen sweep on hover, arrow nudge,
 * press scale, magnetic drift — and an optional ember burst on commit.
 * Keeps every existing accessibility behavior (focus-visible ring comes
 * from globals.css).
 */
export function Button({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  emberBurst = false,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const reduceMotion = useReducedMotion();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (emberBurst && !reduceMotion) {
        burstAt(e.clientX, e.clientY);
      }
      onClick?.(e);
    },
    [emberBurst, onClick, reduceMotion],
  );

  const base = cn(
    'cf-btn group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-sm px-6 py-3 text-xs font-medium uppercase tracking-[0.08em] transition-colors duration-200',
    variant === 'primary'
      ? 'bg-gold text-black hover:bg-gold-lt'
      : 'border border-gold/45 bg-transparent text-gold hover:border-gold hover:bg-gold/10',
    disabled && 'pointer-events-none opacity-50',
    className,
  );

  const inner = (
    <>
      {/* Sheen sweep — slides across on hover. */}
      <span
        aria-hidden
        className="cf-btn-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 opacity-0 blur-sm transition-opacity duration-200 group-hover:opacity-100"
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  const content = href ? (
    <Link href={href} aria-label={ariaLabel} className={base} onClick={handleClick}>
      {inner}
    </Link>
  ) : (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      className={base}
      onClick={handleClick}
    >
      {inner}
    </button>
  );

  return <MagneticButton>{content}</MagneticButton>;
}
