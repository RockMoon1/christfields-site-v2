'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { titleFor } from './nav-data';

/**
 * Top bar. Logo and the page title on the left, the Clerk account button on
 * the right. No hamburger: the bottom tab bar is the whole menu on a phone.
 * Leaders also find "Lead your group" inside the account menu.
 *
 * IMPORTANT: do NOT add backdrop-filter / backdrop-blur to the header below.
 * backdrop-filter on a sticky element traps fixed descendants (the Clerk
 * popovers). Use a solid background here.
 */
export function TopBar({ isLeader = false }: { isLeader?: boolean }) {
  const pathname = usePathname();
  const title = titleFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-sub bg-black-2 px-4 pt-[env(safe-area-inset-top)] md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" className="flex shrink-0 items-center lg:hidden" aria-label="Home">
          <Image src="/assets/logo.png" alt="" width={28} height={28} />
        </Link>
        <p className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted lg:block">
          Christ Fields
        </p>
        <span className="hidden text-muted lg:inline">/</span>
        <h1 className="truncate text-sm font-medium text-ivory">{title}</h1>
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
        >
          {isLeader && (
            <UserButton.MenuItems>
              <UserButton.Link label="Lead your group" href="/dashboard/lead" labelIcon={<LeadMenuIcon />} />
              <UserButton.Link label="Post something" href="/dashboard/lead/post" labelIcon={<PlusMenuIcon />} />
            </UserButton.MenuItems>
          )}
        </UserButton>
      </div>
    </header>
  );
}

function LeadMenuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="3.6" r="1.2" fill="currentColor" />
      <circle cx="3.9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="12.1" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

function PlusMenuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
