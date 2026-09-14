import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
type Control = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' };
/** Associates one native control with its label, hint, and persistent error slot. */
export function Field({ id, label, hint, error, children, className }: {
  id: string; label: ReactNode; hint?: ReactNode; error?: string | null;
  children: ReactElement<Control>; className?: string;
}) {
  const describedBy = [children.props['aria-describedby'], hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(' ');
  return <div className={cn('space-y-2', className)}>
    <label htmlFor={id} className="block text-sm font-medium text-ivory">{label}</label>
    {cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : children.props['aria-invalid'] })}
    {hint && <p id={`${id}-hint`} className="text-sm leading-relaxed text-silver">{hint}</p>}
    <p id={`${id}-error`} aria-live="polite" aria-atomic="true" className="min-h-6 text-sm leading-relaxed text-danger-lt">{error ?? ''}</p>
  </div>;
}
