import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// These theme names are font sizes, not colors. Register them so a text-ivory
// foreground does not silently erase text-display-lg or text-meta.
const twMerge = extendTailwindMerge({
  extend: { classGroups: {
    'font-size': [{ text: ['display-hero', 'display-xl', 'display-lg', 'display-md', 'display-sm', 'meta'] }],
  } },
});

/**
 * Combines class names with Tailwind merge so duplicate or conflicting
 * utility classes resolve cleanly. Use throughout the codebase whenever
 * className gets dynamic or conditional.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
