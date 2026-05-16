import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind merge so duplicate or conflicting
 * utility classes resolve cleanly. Use throughout the codebase whenever
 * className gets dynamic or conditional.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
