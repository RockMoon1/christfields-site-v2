import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';
import { CONTROL_BASE } from './control';
export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input {...props} className={cn(CONTROL_BASE, className)} />;
}
