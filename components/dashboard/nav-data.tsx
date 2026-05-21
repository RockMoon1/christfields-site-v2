import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

/**
 * Shared dashboard navigation list. Used by both the desktop Sidebar and
 * the mobile MobileNav drawer so the two stay in sync automatically.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: <DotIcon /> },
  { href: '/dashboard/rhythms', label: 'Rhythms', icon: <FlameIcon /> },
  { href: '/dashboard/prayer', label: 'Prayer', icon: <PrayerIcon /> },
  { href: '/dashboard/reflect', label: 'Reflect', icon: <MoonIcon /> },
  { href: '/dashboard/scripture', label: 'Scripture', icon: <ScrollIcon /> },
  { href: '/dashboard/progress', label: 'Progress', icon: <BarIcon /> },
  { href: '/dashboard/resources', label: 'Resources', icon: <BookIcon /> },
  { href: '/dashboard/community', label: 'Community', icon: <PeopleIcon /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <GearIcon /> },
];

/* ============================================================
   Inline icons. Minimal 16x16 line icons, currentColor.
   ============================================================ */

function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M8 1.5c2 2.5 1 4 .2 4.8C7 7.6 6 6.8 6 5.4 4.5 6.7 3.5 8.4 3.5 10a4.5 4.5 0 109 0c0-2.2-1.4-4.2-2.8-5.6-.6 1.2-1.7 1.6-1.7 1.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrayerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M8 2v5M8 7c0 2-1.5 3-3 3.5M8 7c0 2 1.5 3 3 3.5M5 10.5V13M11 10.5V13M5 13h6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 100 10A5.5 5.5 0 0013 9.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScrollIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M4 3h7a1.5 1.5 0 011.5 1.5v8a1 1 0 01-1 1H5a1.5 1.5 0 01-1.5-1.5V3z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M3 3.5A1.5 1.5 0 014.5 2 1.5 1.5 0 016 3.5V5H3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 6.5h4M6 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M2 12V8M6 12V4M10 12V6M14 12V2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <path
        d="M2 3v10c1.5-1 4-1 6-1V2C6 2 3.5 2 2 3z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v10c-1.5-1-4-1-6-1V2c2 0 4.5 0 6 1z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="6" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 13c0-2 1.6-3.5 3.5-3.5S9.5 11 9.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.5 4a2 2 0 010 4M11 9.6c1.6.2 2.8 1.6 2.8 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
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
