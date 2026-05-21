'use client';

import { OrganizationProfile, CreateOrganization } from '@clerk/nextjs';

const IVORY     = '#f0f2ee';
const IVORY_DIM = '#c4ccca';
const GOLD      = '#c9a548';
const GOLD_LT   = '#e4c97a';
const BLACK_2   = '#0c110e';
const BLACK_3   = '#131a16';
const BLACK_4   = '#1a221d';
const BORDER    = 'rgba(255,255,255,0.07)';

/** Shared appearance applied to both Clerk components. */
const clerkAppearance = {
  variables: {
    colorPrimary:         GOLD,
    colorBackground:      BLACK_2,
    colorInputBackground: BLACK_3,
    colorInputText:       IVORY,
    colorText:            IVORY,
    colorTextSecondary:   IVORY_DIM,
    colorNeutral:         IVORY,
    colorDanger:          '#dc2626',
    fontFamily:           'var(--font-inter)',
    borderRadius:         '0.125rem',
  },
  elements: {
    // ── Card / root shell ──────────────────────────────────────────────
    card: {
      background:   BLACK_2,
      border:       `1px solid ${BORDER}`,
      borderRadius: '0.125rem',
      boxShadow:    'none',
    },
    rootBox: {
      width: '100%',
    },

    // ── Navbar (left sidebar in OrganizationProfile) ───────────────────
    navbar: {
      background:  BLACK_3,
      borderRight: `1px solid ${BORDER}`,
    },
    navbarButton: {
      color:        IVORY_DIM,
      borderRadius: '0.125rem',
    },
    'navbarButton__active': {
      color:      IVORY,
      background: BLACK_4,
    },
    navbarButtonIcon: { color: IVORY_DIM },

    // ── Org preview in sidebar ─────────────────────────────────────────
    organizationPreviewMainIdentifier:      { color: IVORY },
    organizationPreviewSecondaryIdentifier: { color: IVORY_DIM },
    organizationPreviewAvatarBox:           { borderRadius: '0.125rem' },

    // ── Main content scroll area ───────────────────────────────────────
    pageScrollBox: { background: BLACK_2 },
    scrollBox:     { background: BLACK_2 },

    // ── Section titles ("Members", "Invitations", etc.) ───────────────
    profileSectionTitle: {
      borderBottom: `1px solid ${BORDER}`,
    },
    profileSectionTitleText: {
      color:         IVORY,
      fontSize:      '0.68rem',
      fontWeight:    500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
    },
    profileSectionContent: { color: IVORY_DIM },
    profileSectionItem:    { color: IVORY_DIM },

    // ── Profile action buttons (ghost style) ──────────────────────────
    profileSectionPrimaryButton: {
      color:        IVORY,
      background:   'transparent',
      border:       `1px solid ${BORDER}`,
      borderRadius: '0.125rem',
      fontSize:     '0.7rem',
      fontWeight:   500,
    },

    // ── Primary CTA (gold fill, dark text) ────────────────────────────
    formButtonPrimary: {
      background:    GOLD,
      color:         '#000',
      fontSize:      '0.7rem',
      fontWeight:    500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.07em',
      borderRadius:  '0.125rem',
    },

    // ── Form fields ────────────────────────────────────────────────────
    formFieldLabel: {
      color:         IVORY_DIM,
      fontSize:      '0.7rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    formFieldInput: {
      color:        IVORY,
      background:   BLACK_3,
      border:       `1px solid ${BORDER}`,
      borderRadius: '0.125rem',
    },
    formFieldHintText:  { color: IVORY_DIM },
    formFieldErrorText: { color: '#f87171' },
    formButtonReset:    { color: IVORY_DIM },

    // ── Table / member rows ────────────────────────────────────────────
    tableHead: {
      background:   BLACK_3,
      borderBottom: `1px solid ${BORDER}`,
    },
    tableBody: { background: BLACK_2 },

    // ── Badges ────────────────────────────────────────────────────────
    badge: {
      color:        IVORY_DIM,
      background:   BLACK_4,
      border:       `1px solid ${BORDER}`,
      borderRadius: '0.125rem',
    },
    badgeText: { color: IVORY_DIM, fontSize: '0.65rem' },

    // ── Select menus (role picker) ────────────────────────────────────
    select:        { background: BLACK_3, border: `1px solid ${BORDER}` },
    selectButton:  { background: BLACK_3, color: IVORY, border: `1px solid ${BORDER}` },
    selectOption:  { background: BLACK_3, color: IVORY },
    selectOptions: { background: BLACK_3, border: `1px solid ${BORDER}` },

    // ── Alerts / info banners ─────────────────────────────────────────
    alertText: { color: IVORY_DIM },

    // ── Danger ────────────────────────────────────────────────────────
    formButtonDanger: { color: '#f87171' },

    // ── Footer links ──────────────────────────────────────────────────
    footerActionLink: { color: GOLD_LT },
  },
};

interface RosterPanelProps {
  hasGroup: boolean;
  orgName: string | null;
}

export default function RosterPanel({ hasGroup, orgName }: RosterPanelProps) {
  if (!hasGroup) {
    return (
      <div className="space-y-6">
        {/* Explainer */}
        <div className="rounded-sm border border-border-sub bg-black-3 p-5 md:p-6">
          <p className="mb-1 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-gold">
            Start here
          </p>
          <h2 className="mb-2 font-display font-light text-xl text-ivory">
            Start your FaithFlow group
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-ivory-dim">
            Create a group to get started. Once it is set up, you can invite
            students by email and Clerk sends them a secure invitation to join.
            You control who is in the cohort and what role each person holds.
          </p>
        </div>

        {/* CreateOrganization component */}
        <div className="rounded-sm border border-border-sub bg-black-2 p-2 md:p-4">
          <CreateOrganization
            afterCreateOrganizationUrl="/dashboard/leader"
            appearance={clerkAppearance}
          />
        </div>

        {/* Security note */}
        <p className="text-xs text-muted">
          Invitations and account creation are handled securely by Clerk.
          Christ Fields does not store invitation tokens or passwords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Helper line */}
      <p className="text-sm text-ivory-dim">
        Invite students by email. They get an invitation to join. Remove or
        change roles any time.
        {orgName ? (
          <span className="ml-1 text-silver">
            Managing: <span className="text-ivory">{orgName}</span>.
          </span>
        ) : null}
      </p>

      {/* OrganizationProfile component */}
      <div className="rounded-sm border border-border-sub bg-black-2 p-2 md:p-4">
        <OrganizationProfile appearance={clerkAppearance} />
      </div>

      {/* Security note */}
      <p className="text-xs text-muted">
        Invitations and account creation are handled securely by Clerk.
        Christ Fields does not store invitation tokens or passwords.
      </p>
    </div>
  );
}
