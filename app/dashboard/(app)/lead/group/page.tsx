import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ledOrgs } from '@/lib/groups/membership';
import { getGroupPage } from '../actions';
import { WhenToGather } from '@/components/lead/WhenToGather';
import { GroupTools } from '@/components/lead/GroupTools';
import { RosterFor } from '@/components/lead/RosterFor';

/**
 * Your group: who is in it (Clerk handles invites, roles and removals) and
 * when to gather (the free/busy picture with the three best times).
 */
export default async function GroupPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const sp = await searchParams;
  const orgs = await ledOrgs();
  if (orgs.length === 0) redirect('/dashboard');
  const orgId = orgs.find((o) => o.orgId === sp.org)?.orgId ?? orgs[0].orgId;
  const page = await getGroupPage(orgId);
  if (!page) redirect('/dashboard/lead');

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/lead" className="mb-4 inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-silver">
        &larr; Lead
      </Link>
      <header className="mb-6">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Your group</p>
        <h2 className="font-display text-3xl font-light text-ivory">{page.orgName}</h2>
        {orgs.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {orgs.map((o) => (
              <Link
                key={o.orgId}
                href={`/dashboard/lead/group?org=${encodeURIComponent(o.orgId)}`}
                className={
                  o.orgId === orgId
                    ? 'rounded-full border border-border-gold bg-gold/15 px-3 py-1 text-xs text-gold-lt'
                    : 'rounded-full border border-border-sub px-3 py-1 text-xs text-silver hover:text-ivory'
                }
              >
                {o.orgName}
              </Link>
            ))}
          </div>
        )}
      </header>

      <section className="mb-10">
        <h3 className="mb-1 font-display text-2xl font-light text-ivory">When to gather</h3>
        <p className="mb-4 text-sm text-silver">
          {page.availability.informed} of {page.availability.total} have told us when they are free. Names are who said
          they are free. Nobody is ever shown as busy.
        </p>
        <WhenToGather availability={page.availability} orgId={orgId} lastRefreshedAt={page.lastRefreshedAt} />
      </section>

      {page.notSeen.length > 0 && (
        <section className="mb-10 rounded-sm border border-border-sub bg-black-3 p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Not seen in a while</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {page.notSeen.map((p) => (
              <li key={`${p.name}-${p.email}`}>
                {p.email ? (
                  <a
                    href={`mailto:${p.email}?subject=${encodeURIComponent('Missed you')}`}
                    className="inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-3 text-sm text-ivory hover:border-border-gold"
                  >
                    {p.name} <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.1em] text-gold">Send a note</span>
                  </a>
                ) : (
                  <span className="inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-3 text-sm text-ivory">{p.name}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-silver">
            Two weeks or more since they were in the room, or said yes to something that happened. Only you see this. A
            text from you beats anything the app can send.
          </p>
        </section>
      )}

      <GroupTools orgId={orgId} inviteText={page.inviteText} knownCount={page.knownCount} total={page.availability.total} />

      <section className="mt-10">
        <h3 className="mb-1 font-display text-2xl font-light text-ivory">People</h3>
        <p className="mb-4 text-sm text-silver">Invite by email, change roles, or remove someone.</p>
        <RosterFor orgId={orgId} orgName={page.orgName} />
      </section>
    </div>
  );
}
