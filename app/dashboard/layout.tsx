import { ClerkProvider } from '@clerk/nextjs';

/**
 * Dashboard-only layout. Wraps every /dashboard/* route (including sign-in
 * and sign-up) with ClerkProvider so Clerk components have a context to
 * render in.
 *
 * Important: ClerkProvider lives here, NOT in the root layout. The public
 * marketing site (/, /journal, /faithflow) must work without Clerk env
 * vars present. By scoping ClerkProvider to /dashboard, the public site
 * never tries to initialize Clerk and never breaks if the keys are missing.
 */
export default function DashboardClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#c9a548',
          colorBackground: '#0c110e',
          colorInputBackground: '#131a16',
          colorInputText: '#f0f2ee',
          colorText: '#f0f2ee',
          colorTextSecondary: '#8a9a92',
          colorNeutral: '#f0f2ee',
          colorDanger: '#dc2626',
          colorSuccess: '#2d6a4f',
          fontFamily: 'var(--font-inter)',
          borderRadius: '0.125rem',
        },
        elements: {
          card: 'bg-black-2 border border-border-sub shadow-2xl',
          headerTitle: 'font-display font-light text-ivory text-3xl',
          headerSubtitle: 'text-silver',
          socialButtonsBlockButton:
            'border-border-sub bg-black-3 hover:bg-black-4 text-ivory',
          formButtonPrimary:
            'bg-gold hover:bg-gold-lt text-black text-xs uppercase tracking-[0.07em] font-medium',
          footerActionLink: 'text-gold-lt hover:text-gold',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
