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
 *
 * Appearance notes:
 * - `variables` set the CSS custom properties Clerk injects globally. These
 *   work well for colors that Clerk components actually inherit.
 * - `elements` can accept EITHER a Tailwind class string OR a CSS style
 *   object. We use style objects for text-color overrides because Clerk's
 *   internal CSS has higher specificity than a single Tailwind utility and
 *   would win otherwise. Background/border overrides still use class strings
 *   since those tend to be lower-specificity in Clerk's own sheets.
 */

const IVORY = '#f0f2ee';
const IVORY_DIM = '#c4ccca';
const SILVER = '#8a9a92';
const GOLD = '#c9a548';
const GOLD_LT = '#e4c97a';
const BLACK_2 = '#0c110e';
const BLACK_3 = '#131a16';
const BLACK_4 = '#1a221d';
const BORDER = 'rgba(255,255,255,0.055)';

export default function DashboardClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: GOLD,
          colorBackground: BLACK_2,
          colorInputBackground: BLACK_3,
          colorInputText: IVORY,
          colorText: IVORY,
          // Raised from #8a9a92 so subtitles and secondary labels are legible
          colorTextSecondary: IVORY_DIM,
          colorNeutral: IVORY,
          colorDanger: '#dc2626',
          colorSuccess: '#2d6a4f',
          fontFamily: 'var(--font-inter)',
          borderRadius: '0.125rem',
        },
        elements: {
          // ── Cards / containers ────────────────────────────────────────
          card: 'bg-black-2 border border-border-sub shadow-2xl',
          modalContent: 'bg-black-2 border border-border-sub',
          modalCloseButton: { color: SILVER },

          // ── Auth page elements (sign-in / sign-up) ───────────────────
          headerTitle: 'font-display font-light text-ivory text-3xl',
          headerSubtitle: { color: IVORY_DIM },
          socialButtonsBlockButton:
            'border-border-sub bg-black-3 hover:bg-black-4 text-ivory',
          formButtonPrimary:
            'bg-gold hover:bg-gold-lt text-black text-xs uppercase tracking-[0.07em] font-medium',
          footerActionLink: 'text-gold-lt hover:text-gold',

          // ── UserProfile "Manage account" modal ───────────────────────

          // Sidebar shell
          navbar: `bg-black-3`,
          navbarButton: { color: IVORY_DIM, borderRadius: '0.125rem' },
          navbarButtonIcon: { color: SILVER },

          // User preview (avatar + name at top of sidebar)
          userPreviewMainIdentifier: { color: IVORY },
          userPreviewSecondaryIdentifier: { color: IVORY_DIM },

          // Main content scroll area
          pageScrollBox: { background: BLACK_2 },
          scrollBox: { background: BLACK_2 },

          // Section structure in the profile content
          profileSectionTitle: {
            borderBottom: `1px solid ${BORDER}`,
          },
          profileSectionTitleText: {
            color: IVORY,
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          },
          profileSectionContent: { color: IVORY_DIM },
          profileSectionItem: { color: IVORY },
          profileSectionPrimaryButton: {
            color: IVORY_DIM,
            background: BLACK_3,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.125rem',
          },

          // Accordion sections (connected accounts, etc.)
          accordionTriggerButton: { color: IVORY },
          accordionContent: { color: IVORY_DIM },

          // Form elements inside the profile
          formFieldLabel: {
            color: SILVER,
            fontSize: '0.7rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          },
          formFieldInput: {
            color: IVORY,
            background: BLACK_3,
            border: `1px solid ${BORDER}`,
          },
          formFieldHintText: { color: SILVER },
          formFieldErrorText: { color: '#f87171' },
          formButtonReset: { color: GOLD_LT },

          // Badge chips (e.g. "Primary" next to email)
          badge: {
            color: SILVER,
            background: BLACK_4,
            border: `1px solid ${BORDER}`,
          },
          badgeText: { color: SILVER, fontSize: '0.7rem' },

          // Danger actions
          formButtonDanger: { color: '#f87171' },

          // Info / alert text
          alertText: { color: IVORY_DIM },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
