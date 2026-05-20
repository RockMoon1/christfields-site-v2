import { ClerkProvider } from '@clerk/nextjs';

/**
 * Dashboard-only layout. Wraps every /dashboard/* route (including sign-in
 * and sign-up) with ClerkProvider so Clerk components have a context to
 * render in.
 *
 * Appearance strategy:
 * - variables  → Clerk's CSS custom properties. Most text/background colors
 *               are set here so they cascade everywhere automatically.
 * - elements   → Fine-grained overrides. We use STYLE OBJECTS (not Tailwind
 *               class strings) for text/background/border overrides because
 *               inline styles beat Clerk's own stylesheet specificity.
 *               Tailwind strings are kept only where they add layout classes
 *               (e.g. shadow, font-display) that Clerk doesn't compete with.
 */

const IVORY     = '#f0f2ee';
const IVORY_DIM = '#c4ccca';
const GOLD      = '#c9a548';
const GOLD_LT   = '#e4c97a';
const BLACK_2   = '#0c110e';
const BLACK_3   = '#131a16';
const BLACK_4   = '#1a221d';
const BORDER    = 'rgba(255,255,255,0.07)';

export default function DashboardClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary:         GOLD,
          colorBackground:      BLACK_2,
          colorInputBackground: BLACK_3,
          colorInputText:       IVORY,
          colorText:            IVORY,
          colorTextSecondary:   IVORY_DIM,
          colorNeutral:         IVORY,
          colorDanger:          '#dc2626',
          colorSuccess:         '#2d6a4f',
          fontFamily:           'var(--font-inter)',
          borderRadius:         '0.125rem',
        },
        elements: {
          // ── Shared containers ─────────────────────────────────────────
          card:         'bg-black-2 border border-border-sub shadow-2xl',
          modalContent: { background: BLACK_2, border: `1px solid ${BORDER}` },
          modalCloseButton: { color: IVORY_DIM },

          // ── Auth forms (sign-in / sign-up) ────────────────────────────
          headerTitle: 'font-display font-light text-ivory text-3xl',
          headerSubtitle: { color: IVORY_DIM },
          socialButtonsBlockButton:
            'border-border-sub bg-black-3 hover:bg-black-4 text-ivory',
          footerActionLink: { color: GOLD_LT },

          // Primary submit button (Sign in / Sign up) stays gold
          formButtonPrimary: {
            background:    GOLD,
            color:         '#000',
            fontSize:      '0.7rem',
            fontWeight:    500,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            borderRadius:  '0.125rem',
          },

          // ── UserProfile "Manage account" ──────────────────────────────

          // Left sidebar
          navbar: { background: BLACK_3, borderRight: `1px solid ${BORDER}` },

          // Nav buttons — both active and inactive states
          navbarButton: {
            color:        IVORY_DIM,
            borderRadius: '0.125rem',
          },
          // Clerk v7 uses __active suffix for the selected item
          'navbarButton__active': {
            color:      IVORY,
            background: BLACK_4,
          },

          navbarButtonIcon: { color: IVORY_DIM },

          // Sidebar user preview (avatar row)
          userPreviewMainIdentifier:      { color: IVORY },
          userPreviewSecondaryIdentifier: { color: IVORY_DIM },

          // Main content area
          pageScrollBox: { background: BLACK_2 },
          scrollBox:     { background: BLACK_2 },

          // Profile sections
          profileSectionTitle:     { borderBottom: `1px solid ${BORDER}` },
          profileSectionTitleText: {
            color:         IVORY,
            fontSize:      '0.68rem',
            fontWeight:    500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          },
          profileSectionContent: { color: IVORY_DIM },
          profileSectionItem:    { color: IVORY_DIM },

          // Action buttons inside sections ("Update profile", "Add email", etc.)
          // These override formButtonPrimary for the profile context
          profileSectionPrimaryButton: {
            color:        IVORY,
            background:   'transparent',
            border:       `1px solid ${BORDER}`,
            borderRadius: '0.125rem',
            fontSize:     '0.7rem',
            fontWeight:   500,
          },

          // Accordion items (connected accounts, passkeys, etc.)
          accordionTriggerButton: { color: IVORY_DIM },
          accordionContent:       { color: IVORY_DIM },

          // Form fields within the profile edit forms
          formFieldLabel:     { color: IVORY_DIM, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' },
          formFieldInput:     { color: IVORY, background: BLACK_3, border: `1px solid ${BORDER}` },
          formFieldHintText:  { color: IVORY_DIM },
          formFieldErrorText: { color: '#f87171' },
          formButtonReset:    { color: IVORY_DIM },

          // Badges ("Primary", "Unverified", etc.)
          badge:     { color: IVORY_DIM, background: BLACK_4, border: `1px solid ${BORDER}` },
          badgeText: { color: IVORY_DIM, fontSize: '0.65rem' },

          // Danger / destructive
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
