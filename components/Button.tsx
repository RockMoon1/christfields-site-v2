'use client';

import { useRouter } from 'next/navigation';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { type ReactNode, type MouseEvent, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type Ref, useEffect, useRef } from 'react';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { cn } from '@/lib/utils';

interface SharedButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fx?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  /** Only confirmed success can trigger the optional celebration. */
  success?: boolean;
  /**
   * Opt into a one-shot burst when success changes to true. Never on submit.
   */
  emberBurst?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

type ButtonProps = SharedButtonProps & (
  | (Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedButtonProps> & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
  })
  | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedButtonProps | 'href'> & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  })
);

/** A stable anchor keeps focus when pending removes its destination. Internal
 * page changes use the App Router; hash links, modified clicks, downloads and
 * other browsing contexts retain native behavior. Prefetch happens on intent. */
function NavigationAnchor({ href, blocked, onClick, onFocus, onMouseEnter, tabIndex, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  blocked: boolean;
  ref?: Ref<HTMLAnchorElement>;
}) {
  const router = useRouter();
  function localDestination() {
    if (href.startsWith('#')) return null;
    try {
      const url = new URL(href, window.location.href);
      // Keep the verified absolute URL: stripping the origin can turn a
      // double-slash pathname into a different, protocol-relative destination.
      return ['http:', 'https:'].includes(url.protocol) && url.origin === window.location.origin
        ? url.href : null;
    } catch { return null; }
  }
  function prefetch() {
    if (blocked || (props.target && props.target !== '_self') || (props.download !== undefined && props.download !== false)) return;
    const destination = localDestination();
    if (destination) router.prefetch(destination);
  }
  return <a
    {...props}
    role={props.role ?? 'link'}
    href={blocked ? undefined : href}
    tabIndex={tabIndex ?? 0}
    onFocus={(event) => { onFocus?.(event); if (!event.defaultPrevented) prefetch(); }}
    onMouseEnter={(event) => { onMouseEnter?.(event); if (!event.defaultPrevented) prefetch(); }}
    onClick={(event) => {
      if (blocked) { event.preventDefault(); return; }
      onClick?.(event);
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        (event.currentTarget.target && event.currentTarget.target !== '_self') || event.currentTarget.hasAttribute('download')) return;
      const destination = localDestination();
      if (destination) { event.preventDefault(); router.push(destination); }
    }}
  />;
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
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fx = true,
  pending = false,
  pendingLabel = 'Saving…',
  success = false,
  emberBurst = false,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const labelRef = useRef<HTMLSpanElement>(null);
  const previousSuccess = useRef(success);
  useEffect(() => {
    if (success && !previousSuccess.current && emberBurst && fx && !reduceMotion) {
      const rect = labelRef.current?.getBoundingClientRect();
      if (rect) burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    previousSuccess.current = success;
  }, [success, emberBurst, fx, reduceMotion]);
  const blocked = disabled || pending;
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (blocked) { e.preventDefault(); return; }
    onClick?.(e);
  };
  const variants = {
    primary: 'bg-gold text-black hover:bg-gold-lt focus-visible:bg-gold-lt',
    ghost: 'border border-gold/45 bg-transparent text-gold-lt hover:border-gold hover:bg-gold/10',
    quiet: 'border border-border-sub bg-black-3 text-ivory-dim hover:border-gold/40 hover:text-ivory',
    danger: 'border border-danger/50 bg-danger-dk/30 text-danger-lt hover:bg-danger-dk/60',
  };
  const sizes = { sm: 'min-h-11 px-4 py-2', md: 'min-h-11 px-6 py-3', lg: 'min-h-12 px-6 py-3.5' };

  const base = cn(
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-sm text-sm font-medium transition-colors duration-200',
    fx && 'cf-btn uppercase tracking-[0.1em]',
    variants[variant], sizes[size],
    blocked && 'cursor-not-allowed opacity-50',
    className,
  );

  const inner = (
    <>
      {/* Sheen sweep — slides across on hover. */}
      {fx && <span
        aria-hidden
        className="cf-btn-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 opacity-0 blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      />}
      <span ref={labelRef} className="relative z-10 grid place-items-center">
        <span className={cn('col-start-1 row-start-1 inline-flex items-center gap-2', pending && 'invisible')} aria-hidden={pending || undefined}>{children}</span>
        <span className={cn('col-start-1 row-start-1', !pending && 'invisible')} aria-hidden={!pending || undefined}>{pendingLabel}</span>
      </span>
    </>
  );

  let content: ReactNode;
  if (props.href !== undefined) {
    const { href, ref, ...linkProps } = props;
    content = (
      <NavigationAnchor {...linkProps} ref={ref} href={href} blocked={blocked}
        aria-label={ariaLabel} aria-disabled={blocked || undefined} aria-busy={pending || undefined}
        className={base} onClick={handleClick}>
        {inner}
      </NavigationAnchor>
    );
  } else {
    const { href: _href, ref, ...buttonProps } = props;
    content = (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      disabled={blocked}
      aria-busy={pending || undefined}
      className={base}
      onClick={handleClick}
    >
      {inner}
    </button>
    );
  }

  return fx ? <MagneticButton>{content}</MagneticButton> : content;
}
