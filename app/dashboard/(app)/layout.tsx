import { auth } from '@clerk/nextjs/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { isLeaderRole, isMasterRole } from '@/lib/faithflow/roles';

// The authenticated dashboard is per-user and dynamic (it reads Clerk auth and
// Supabase on every request), so opt the whole segment out of static
// generation. Keeps build logs clean and avoids prerendering private data.
export const dynamic = 'force-dynamic';

/**
 * Layout for the member dashboard. Wraps every /dashboard/(app)/* page with the
 * sidebar and top bar. Auth is enforced upstream by middleware.ts.
 *
 * We read the active org role here (free, from the session) to decide whether
 * to show the leader entry in the sidebar. Org admins are FaithFlow leaders.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgRole } = await auth();
  const isLeader = isLeaderRole(orgRole);
  const isMaster = isMasterRole(orgRole);

  return (
    <div className="min-h-screen bg-black-2 text-ivory">
      <Sidebar isLeader={isLeader} />
      <div className="lg:pl-60">
        <TopBar isLeader={isLeader} isMaster={isMaster} />
        <main className="px-4 py-6 sm:px-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
