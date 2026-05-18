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
  { href: '/dashboard/progress', label: 'Progress', icon: <BarIcon /> },
  { href: '/dashboard/resources', label: 'Resources', icon: <BookIcon /> },
  { href: '/dashboard/photos', label: 'Photos', icon: <PhotoIcon /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <GearIcon /> },
];

/* ============================================================
   Inline icons.
   ============================================================ */

function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
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
function PhotoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <path d="M2 11l3-3 3 3 4-4 3 3" stroke="currentColor" strokeWidth="1.2" />
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
