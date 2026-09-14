import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  default: 'border-border-sub bg-black-3',
  accent: 'border-border-gold bg-black-3',
  wash: 'border-gold/25 bg-gold/[0.04]',
  recessed: 'border-border-sub bg-black-2',
  dashed: 'border-dashed border-border-gold bg-transparent',
  danger: 'border-danger/40 bg-danger-dk/20',
} as const;
const pads = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' } as const;

/** Shared material, not shared behavior. Interactive content retains its own
 * semantics and 44px targets (as in faithflow/GetInvolved). */
export function Surface({ as: Tag = 'section', tone = 'default', pad = 'md', seam = false,
  interactive = false, className, ...props
}: HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article'; tone?: keyof typeof tones; pad?: keyof typeof pads;
  seam?: boolean; interactive?: boolean;
}) {
  return <Tag {...props} className={cn('relative rounded-sm border', tones[tone], pads[pad],
    seam && 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gold/50',
    interactive && 'transition-colors duration-200 focus-within:border-gold/60', className)} />;
}
