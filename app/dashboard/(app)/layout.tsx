import { auth } from '@clerk/nextjs/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';

/**
 * Layout for the member dashboard. Wraps every /dashboard/* page (except the
 * sign-in / sign-up flows which use their own layout) with the sidebar and
 * top bar.
 *
 * Auth is enforced upstream by middleware.ts. By the time we render here, the
 * user is signed in.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Touch auth so this layout is treated as protected by Clerk's server runtime.
  await auth();

  return (
    <div className="min-h-screen bg-black-2 text-ivory">
      <Sidebar />
      <div className="lg:pl-60">
        <TopBar />
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
