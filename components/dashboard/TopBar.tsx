'use client';

import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { MobileNav } from './MobileNav';

const titleMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/progress': 'Progress',
  '/dashboard/resources': 'Resources',
  '/dashboard/photos': 'Photos',
  '/dashboard/settings': 'Settings',
};

/**
 * Top bar for the dashboard. Hamburger menu on the left for mobile, current
 * section title in the middle, Clerk UserButton on the right. On desktop
 * the hamburger is hidden and a "Christ Fields / Section" breadcrumb shows.
 */
export function TopBar() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-sub bg-black-2/90 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger for mobile; hides on lg+ */}
        <MobileNav />

        {/* Breadcrumb only visible on desktop. On mobile the title alone
            keeps the bar uncluttered next to the hamburger. */}
        <p className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted lg:block">
          Christ Fields
        </p>
        <span className="hidden text-muted lg:inline">/</span>
        <h1 className="text-sm font-medium text-ivory">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8 ring-1 ring-border-gold',
              userButtonPopoverCard: 'bg-black-2 border border-border-sub',
              userButtonPopoverActionButton:
                'text-silver hover:text-ivory hover:bg-black-3',
              userButtonPopoverFooter: 'hidden',
            },
          }}
        />
      </div>
    </header>
  );
}
