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
 * Leaders and masters get extra links inside the avatar menu (Leader dashboard,
 * Master oversight). These are convenience only: access is enforced on the
 * server, so the links are shown to authorized users and do nothing for anyone
 * else even if they reach the URL.
 *
 * IMPORTANT: do NOT add backdrop-filter / backdrop-blur to the header below.
 * backdrop-filter on a sticky element traps fixed descendants (the MobileNav
 * drawer and the Clerk popovers). Use a solid background here.
 */
export function TopBar({
  isLeader = false,
  isMaster = false,
}: {
  isLeader?: boolean;
  isMaster?: boolean;
}) {
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
        >
          {(isLeader || isMaster) && (
            <UserButton.MenuItems>
              {isLeader && (
                <UserButton.Link
                  label="Leader dashboard"
                  labelIcon={<LeaderMenuIcon />}
                  href="/dashboard/leader"
                />
              )}
              {isMaster && (
                <UserButton.Link
                  label="Master oversight"
                  labelIcon={<MasterMenuIcon />}
                  href="/dashboard/master"
                />
              )}
            </UserButton.MenuItems>
          )}
        </UserButton>
      </div>
    </header>
  );
}

function LeaderMenuIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <circle cx="6" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 13c0-2 1.6-3.5 3.5-3.5S9.5 11 9.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.5 4a2 2 0 010 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MasterMenuIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <path
        d="M2.5 5.5l2.5 2 3-3.5 3 3.5 2.5-2-1 6.5h-9l-1-6.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
