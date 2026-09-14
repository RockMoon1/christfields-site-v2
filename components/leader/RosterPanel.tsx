'use client';

import { OrganizationProfile, CreateOrganization } from '@clerk/nextjs';

import { rosterClerkAppearance } from '@/lib/clerk-appearance';

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
            Start your small group
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-ivory-dim">
            Create your small group to get started. Every small group lives within
            Iron and Ember, our one community. Once it is set up, you can invite
            members by email and Clerk sends them a secure invitation to join.
            You control who is in the group and what role each person holds.
          </p>
        </div>

        {/* CreateOrganization component */}
        <div className="rounded-sm border border-border-sub bg-black-2 p-2 md:p-4">
          <CreateOrganization
            afterCreateOrganizationUrl="/dashboard/lead"
            appearance={rosterClerkAppearance}
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
        <OrganizationProfile appearance={rosterClerkAppearance} />
      </div>

      {/* Security note */}
      <p className="text-xs text-muted">
        Invitations and account creation are handled securely by Clerk.
        Christ Fields does not store invitation tokens or passwords.
      </p>
    </div>
  );
}
