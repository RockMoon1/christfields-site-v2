'use client';

import { useEffect } from 'react';
import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import RosterPanel from '@/components/leader/RosterPanel';

/**
 * Clerk's OrganizationProfile always shows the ACTIVE organization, which on a
 * phone is often none, and for a leader of two groups may be the other one.
 * This wrapper makes the group the page is about the active one first, then
 * renders the roster. Authorization already happened on the server
 * (requireLeaderOf) before this page rendered.
 */
export function RosterFor({ orgId, orgName }: { orgId: string; orgName: string }) {
  const { organization, isLoaded } = useOrganization();
  const { setActive, isLoaded: listLoaded } = useOrganizationList();
  const ready = isLoaded && organization?.id === orgId;

  useEffect(() => {
    if (!listLoaded || !isLoaded || !setActive) return;
    if (organization?.id !== orgId) {
      void setActive({ organization: orgId }).catch(() => undefined);
    }
  }, [listLoaded, isLoaded, organization?.id, orgId, setActive]);

  if (!ready) {
    return <p className="text-sm text-muted">Opening {orgName}…</p>;
  }
  return <RosterPanel hasGroup orgName={orgName} />;
}
