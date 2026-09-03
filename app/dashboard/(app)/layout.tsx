import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileTabBar } from '@/components/dashboard/MobileTabBar';
import { TimeZoneSync } from '@/components/dashboard/TimeZoneSync';
import { isLeaderAnywhere } from '@/lib/groups/membership';

// The dashboard is per-user and dynamic (Clerk auth and Supabase on every
// request), so the whole segment opts out of static generation.
export const dynamic = 'force-dynamic';

/**
 * The shell for every member and leader page. Sidebar on desktop, bottom tabs
 * on a phone, no drawer, nothing to reveal. Auth is enforced upstream by
 * middleware.ts; the leader tab shows when the person leads any group.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isLeader = await isLeaderAnywhere();

  return (
    <div className="min-h-screen bg-black-2 text-ivory">
      <Sidebar isLeader={isLeader} />
      <div className="lg:pl-60">
        <TopBar isLeader={isLeader} />
        {/* Extra bottom padding on mobile so content clears the fixed tab bar. */}
        <main id="main" className="px-4 py-6 pb-28 sm:px-6 md:p-10 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileTabBar isLeader={isLeader} />
      <TimeZoneSync />
    </div>
  );
}
