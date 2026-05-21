import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { isMaster } from '@/lib/faithflow/master-access';

/**
 * Immersive shell for the master oversight tier. Gated to masters only;
 * everyone else is sent back to their own dashboard. This is the view above
 * the leaders, for accountability and transparency across every group.
 */
export const dynamic = 'force-dynamic';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  if (!(await isMaster())) redirect('/dashboard');

  return (
    <div className="relative min-h-screen bg-black text-ivory">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% -10%, rgba(201,165,72,0.10) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(27,67,50,0.12) 0%, transparent 55%)',
          }}
        />
        <div className="hidden md:block">
          <MorphBlob color="rgba(201,165,72,0.05)" size={620} className="left-1/4 top-0" />
          <MorphBlob color="rgba(45,106,79,0.06)" size={520} className="-right-32 bottom-0" />
        </div>
      </div>

      {/* Solid bar, never backdrop-blur (it would trap the Clerk popover). */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border-sub bg-black px-4 md:px-8">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gold">FaithFlow</p>
          <p className="font-display text-lg font-light text-ivory">Master oversight</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[11px] font-medium uppercase tracking-[0.07em] text-silver transition-colors hover:text-ivory"
          >
            My dashboard
          </Link>
          <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8 ring-1 ring-border-gold' } }} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:p-10">{children}</main>
    </div>
  );
}
