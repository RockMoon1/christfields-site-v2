'use client';

import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { MobileNav } from './MobileNav';

const titleMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/rhythms': 'Rhythms',
  '/dashboard/prayer': 'Prayer',
  '/dashboard/reflect': 'Reflect',
  '/dashboard/scripture': 'Scripture',
  '/dashboard/progress': 'Progress',
  '/dashboard/resources': 'Resources',
  '/dashboard/community': 'Community',
  '/dashboard/settings': 'Settings',
};

/**
 * Top bar for the dashboard. Hamburger on the left for mobile, the section
 * title in the middle, Clerk UserButton on the right.
 *
 * Leader access lives on the Settings page (and the desktop sidebar), and
 * master access lives inside the leader area, so the UserButton here is the
 * plain Clerk one with no extra menu links.
 *
 * IMPORTANT: do NOT add backdrop-filter / backdrop-blur to the header below.
 * backdrop-filter on a sticky element traps fixed descendants (the MobileNav
 * drawer and the Clerk popovers). Use a solid background here.
 */
export function TopBar() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-sub bg-black-2 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
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
