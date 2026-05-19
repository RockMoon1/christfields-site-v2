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
          // ── Cards / containers ────────────────────────────────────────
          card: 'bg-black-2 border border-border-sub shadow-2xl',
          modalContent: 'bg-black-2 border border-border-sub',
          modalCloseButton: 'text-silver hover:text-ivory',

          // ── Auth page elements (sign-in / sign-up) ───────────────────
          headerTitle: 'font-display font-light text-ivory text-3xl',
          headerSubtitle: 'text-silver',
          socialButtonsBlockButton:
            'border-border-sub bg-black-3 hover:bg-black-4 text-ivory',
          formButtonPrimary:
            'bg-gold hover:bg-gold-lt text-black text-xs uppercase tracking-[0.07em] font-medium',
          footerActionLink: 'text-gold-lt hover:text-gold',

          // ── UserProfile "Manage account" modal ───────────────────────
          // Sidebar nav
          navbar: 'bg-black-3 border-r border-border-sub',
          navbarButton: 'text-silver hover:text-ivory hover:bg-black-4',
          navbarButtonIcon: 'text-muted',

          // User preview (avatar + name) in sidebar
          userPreviewMainIdentifier: 'text-ivory',
          userPreviewSecondaryIdentifier: 'text-silver',

          // Main content scroll area
          pageScrollBox: 'bg-black-2',
          scrollBox: 'bg-black-2',

          // Page / section structure
          profileSectionTitle: 'border-b border-border-sub',
          profileSectionTitleText: 'text-ivory text-sm font-medium uppercase tracking-[0.12em]',
          profileSectionContent: 'text-silver',
          profileSectionItem: 'text-ivory',
          profileSectionPrimaryButton:
            'border border-border-sub bg-black-3 text-silver hover:bg-black-4 hover:text-ivory',

          // Accordion sections
          accordionTriggerButton: 'text-ivory hover:bg-black-3',
          accordionContent: 'text-silver',

          // Form elements inside the profile
          formFieldLabel: 'text-silver text-xs uppercase tracking-[0.14em]',
          formFieldInput: 'bg-black-3 border-border-sub text-ivory',
          formFieldHintText: 'text-muted',
          formFieldErrorText: 'text-red-400',
          formButtonReset: 'text-gold-lt hover:text-gold',

          // Badge / identifier chips
          badge: 'border border-border-sub bg-black-3 text-muted',
          badgeText: 'text-muted text-xs',

          // Danger zone / destructive actions
          formButtonDanger: 'text-red-400 hover:bg-red-950 hover:text-red-300',

          // Alert / info boxes
          alertText: 'text-silver',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
