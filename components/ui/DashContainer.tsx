import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
const widths = { reading: 'max-w-2xl', prose: 'max-w-3xl', board: 'max-w-4xl' } as const;
/** The dashboard layout owns padding; this component owns only reading width. */
export function DashContainer({ width = 'reading', className, ...props }: HTMLAttributes<HTMLDivElement> & { width?: keyof typeof widths }) {
  return <div {...props} className={cn('mx-auto w-full', widths[width], className)} />;
}
