import { auth, currentUser } from '@clerk/nextjs/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileTabBar } from '@/components/dashboard/MobileTabBar';
import { WelcomeOverlay } from '@/components/dashboard/WelcomeOverlay';
import { StageCrossing } from '@/components/dashboard/StageCrossing';
import { TimeZoneSync } from '@/components/dashboard/TimeZoneSync';
import { isLeaderRole } from '@/lib/faithflow/roles';
import { getJourney } from '@/lib/dashboard/journey-data';

// The authenticated dashboard is per-user and dynamic (it reads Clerk auth and
// Supabase on every request), so opt the whole segment out of static
// generation. Keeps build logs clean and avoids prerendering private data.
export const dynamic = 'force-dynamic';

/**
 * Layout for the member dashboard. Wraps every /dashboard/(app)/* page with the
 * sidebar and top bar. Auth is enforced upstream by middleware.ts.
 *
 * We compute the member's journey once here (cached, shared with the page it
 * renders) to decide how much of the nav to reveal and to show the one-time
 * welcome. We also read the active org role to show the leader entry.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ orgRole }, journey, user] = await Promise.all([auth(), getJourney(), currentUser()]);
  const isLeader = isLeaderRole(orgRole);
  const firstName = user?.firstName ?? undefined;

  return (
    <div className="min-h-screen bg-black-2 text-ivory">
      <Sidebar isLeader={isLeader} sections={journey.sections} revealAll={journey.revealAll} />
      <div className="lg:pl-60">
        <TopBar sections={journey.sections} revealAll={journey.revealAll} />
        {/* Extra bottom padding on mobile so content clears the fixed tab bar. */}
        <main className="px-4 py-6 pb-28 sm:px-6 md:p-10 lg:pb-10">{children}</main>
      </div>

      <MobileTabBar sections={journey.sections} revealAll={journey.revealAll} />

      {/* Tells the server which calendar day the member is actually in, so an
          evening examen is filed under this evening and not tomorrow. */}
      <TimeZoneSync />

      {!journey.welcomeSeen && <WelcomeOverlay firstName={firstName} />}
      {journey.welcomeSeen && <StageCrossing stage={journey.crossedInto} />}
    </div>
  );
}
