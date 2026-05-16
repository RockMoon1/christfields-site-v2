import { cn } from '@/lib/utils';

/**
 * Centered max-width 1160px container with horizontal padding.
 * Used throughout the site as the standard content wrapper.
 */
export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1160px] px-7', className)}>
      {children}
    </div>
  );
}
