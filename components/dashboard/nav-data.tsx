import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
  hint: string;
  icon: ReactNode;
}

/**
 * The whole navigation. Three places for a member, one more for a leader.
 * Shared by the desktop Sidebar and the mobile tab bar so they never drift.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    hint: 'What our group is doing next, who is in, and one tap to say if you are coming.',
    icon: <HomeIcon />,
  },
  {
    href: '/dashboard/community',
    label: 'Prayer wall',
    hint: 'Carry each other. Share what you are walking through and pray for one another by name.',
    icon: <PeopleIcon />,
  },
  {
    href: '/dashboard/settings',
    label: 'You',
    hint: 'Reminders, your calendar, when you are usually free, and the app on your phone.',
    icon: <GearIcon />,
  },
];

export const LEAD_ITEM: NavItem = {
  href: '/dashboard/lead',
  label: 'Lead',
  hint: 'Post something, see who is coming, pick a time that works, mark who came.',
  icon: <LeadIcon />,
};

/** Page titles for the top bar. Longest prefix wins. */
export const TITLE_BY_PREFIX: [string, string][] = [
  ['/dashboard/lead/post', 'Post something'],
  ['/dashboard/lead/group', 'Your group'],
  ['/dashboard/lead', 'Lead'],
  ['/dashboard/e/', 'Event'],
  ['/dashboard/community', 'Prayer wall'],
  ['/dashboard/settings', 'You'],
  ['/dashboard/availability', 'When you are free'],
  ['/dashboard/foundation', 'What we stand for'],
  ['/dashboard', 'Home'],
];

export function titleFor(pathname: string): string {
  for (const [prefix, title] of TITLE_BY_PREFIX) {
    if (pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)) return title;
  }
  return 'Christ Fields';
}

/* ============================================================
   Inline icons. Minimal 16x16 line icons, currentColor.
   ============================================================ */

function HomeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M2.5 7.5L8 3l5.5 4.5V13a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5V7.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6.5 13.5v-4h3v4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 6h11M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="6" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 13c0-2 1.6-3.5 3.5-3.5S9.5 11 9.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.5 4a2 2 0 010 4M11 9.6c1.6.2 2.8 1.6 2.8 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeadIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="3.6" r="1.2" fill="currentColor" />
      <circle cx="3.9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="12.1" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full" aria-hidden>
      <path d="M8 14s5-4 5-8A5 5 0 003 6c0 4 5 8 5 8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
