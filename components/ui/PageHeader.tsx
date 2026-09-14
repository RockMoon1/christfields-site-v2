import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
export function PageHeader({ eyebrow, title, children, className }: { eyebrow?: string; title: ReactNode; children?: ReactNode; className?: string }) {
  return <header className={cn('mb-8', className)}>
    {eyebrow && <p className="mb-2 text-meta font-medium uppercase tracking-[0.2em] text-gold">{eyebrow}</p>}
    <h1 className="font-display text-3xl font-light leading-tight text-ivory sm:text-4xl">{title}</h1>
    {children && <div className="mt-3 max-w-[65ch] text-base leading-relaxed text-ivory-dim">{children}</div>}
  </header>;
}
