import { redirect } from 'next/navigation';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { LeaderNav } from '@/components/leader/LeaderNav';
import { isLeaderAnywhere, getLeaderContext } from '@/lib/faithflow/leader-access';
import { isMaster } from '@/lib/faithflow/master-access';

/**
 * Immersive shell for the FaithFlow leader dashboard. Gated to org admins
 * (leaders). Non-leaders are sent back to their own dashboard. This segment
 * deliberately does NOT use the member (app) layout, so leaders get a distinct,
 * focused, desktop-first analytics environment.
 */
export const dynamic = 'force-dynamic';

export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  const leader = await isLeaderAnywhere();
  if (!leader) redirect('/dashboard');

  const [ctx, master] = await Promise.all([getLeaderContext(), isMaster()]);

  return (
    <div className="relative min-h-screen bg-black text-ivory">
      {/* Ambient depth */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 72% 0%, rgba(201,165,72,0.08) 0%, transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(27,67,50,0.14) 0%, transparent 55%)',
          }}
        />
        <div className="hidden md:block">
          <MorphBlob color="rgba(201,165,72,0.05)" size={560} className="-right-40 top-10" />
          <MorphBlob color="rgba(45,106,79,0.06)" size={520} className="-left-32 bottom-0" />
        </div>
      </div>

      <LeaderNav isMaster={master} />

      <div className="lg:pl-64">
        {/* Solid background, never backdrop-blur: a blurred sticky bar would trap
            the Clerk popovers (OrganizationSwitcher, UserButton) inside it. */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border-sub bg-black px-4 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
              {ctx ? 'Leading' : 'FaithFlow Leader'}
            </p>
            <p className="truncate font-display text-lg font-light text-ivory">
              {ctx ? ctx.orgName : 'Choose your group'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard/leader"
              afterSelectOrganizationUrl="/dashboard/leader"
              appearance={{ elements: { organizationSwitcherTrigger: 'text-ivory-dim' } }}
            />
            <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8 ring-1 ring-border-gold' } }} />
          </div>
        </header>

        <main className="px-4 py-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
