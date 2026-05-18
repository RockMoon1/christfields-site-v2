import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { MorphBlob } from '@/components/motion/MorphBlob';

/**
 * Sign-up page for the member dashboard. Invite-only is enforced in Clerk's
 * dashboard settings ("Restrictions" → "Sign-up modes" → "Restricted"), which
 * means this page will show "Sign-up requires an invitation" unless the user
 * arrives via an invitation link from Clerk.
 */
export default function SignUpPage() {
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
          Create your account.
        </h1>
        <p className="mb-10 text-center text-sm text-silver">
          By invitation only.
        </p>

        <SignUp
          path="/dashboard/sign-up"
          routing="path"
          signInUrl="/dashboard/sign-in"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </main>
  );
}
