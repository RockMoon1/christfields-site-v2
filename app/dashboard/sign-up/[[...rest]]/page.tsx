import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { MorphBlob } from '@/components/motion/MorphBlob';

/**
 * Invite-only sign-up. FaithFlow has NO public self-registration.
 *
 * This route only renders Clerk's <SignUp> when the visitor either:
 *   - arrives on an invitation link (Clerk adds a __clerk_ticket query param), or
 *   - is already mid-way through a sign-up flow (a sub-path under /sign-up that
 *     Clerk's multi-step UI navigates to, which never carries the ticket).
 *
 * Everyone else is redirected straight to sign-in, so there is no public
 * "create your account" screen at all. This is a second lock on top of Clerk's
 * Restricted sign-up mode: even if that dashboard setting were ever off, nobody
 * can reach the account-creation form without an invitation.
 */
export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ rest?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ rest }, sp] = await Promise.all([params, searchParams]);
  const midFlow = Array.isArray(rest) && rest.length > 0;
  const ticket = sp['__clerk_ticket'];
  const hasTicket = typeof ticket === 'string' && ticket.length > 0;

  // No invitation ticket and not already in a flow -> there is no public way to
  // create an account. Send them to sign-in.
  if (!midFlow && !hasTicket) {
    redirect('/dashboard/sign-in');
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 50% 28%, rgba(201, 165, 72, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(27, 67, 50, 0.16) 0%, transparent 60%),
            #060908
          `,
        }}
      />
      <MorphBlob color="rgba(201, 165, 72, 0.07)" size={600} className="-left-32 -top-32" />
      <MorphBlob color="rgba(27, 67, 50, 0.08)" size={520} className="-bottom-32 -right-32" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <Link href="/" className="mb-10 flex flex-col items-center gap-3">
          <Image
            src="/assets/logo.png"
            alt="Christ Fields"
            width={56}
            height={56}
            sizes="56px"
            priority
          />
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-gold">
            Christ Fields
          </p>
        </Link>

        <h1 className="mb-2 text-center font-display text-3xl font-light text-ivory md:text-4xl">
          Accept your invitation.
        </h1>
        <p className="mb-10 text-center text-sm text-silver">
          Finish setting up the account you were invited to.
        </p>

        <SignUp
          path="/dashboard/sign-up"
          routing="path"
          signInUrl="/dashboard/sign-in"
          fallbackRedirectUrl="/dashboard/today"
        />
      </div>
    </main>
  );
}
