'use client';

import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

const titleMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/progress': 'Progress',
  '/dashboard/photos': 'Photos',
  '/dashboard/notes': 'Notes',
  '/dashboard/settings': 'Settings',
};

/**
 * Top bar for the dashboard. Shows the current section title on the left,
 * and the Clerk UserButton (avatar + menu) on the right. Resend-style.
 */
export function TopBar() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-sub bg-black-2/90 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Christ Fields
        </p>
        <span className="text-muted">/</span>
        <h1 className="text-sm font-medium text-ivory">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8 ring-1 ring-border-gold',
              userButtonPopoverCard: 'bg-black-2 border border-border-sub',
              userButtonPopoverActionButton: 'text-silver hover:text-ivory hover:bg-black-3',
              userButtonPopoverFooter: 'hidden',
            },
          }}
        />
      </div>
    </header>
  );
}
