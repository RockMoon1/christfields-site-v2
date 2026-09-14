import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';
import { CONTROL_BASE } from './control';
export function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
  return <textarea {...props} className={cn(CONTROL_BASE, 'min-h-28 resize-y leading-relaxed', className)} />;
}
