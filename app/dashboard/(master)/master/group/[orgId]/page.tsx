import Link from 'next/link';
import { getGroupForMaster } from '@/app/dashboard/(master)/master/actions';
import { GroupOverview } from '@/components/leader/GroupOverview';
import type { LeaderActivity } from '@/lib/faithflow/master-access';

export const dynamic = 'force-dynamic';

/* ============================================================
   Timestamp humanizer. Clerk timestamps are unix MILLISECONDS.
   ============================================================ */

function humanizeMs(ms: number | null, label: string): string {
  if (ms === null) return label === 'sign-in' ? 'No sign-in yet' : 'No activity recorded';
  const diffMs = Date.now() - ms;
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return label === 'sign-in' ? 'Signed in today' : 'Active today';
  if (days === 1) return label === 'sign-in' ? 'Signed in yesterday' : 'Active yesterday';
  if (days < 30) return label === 'sign-in' ? `Signed in ${days} days ago` : `Active ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return label === 'sign-in' ? `Signed in ${weeks} weeks ago` : `Active ${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return label === 'sign-in' ? `Signed in ${months} months ago` : `Active ${months} months ago`;
}

function isEngaged(lastActiveAt: number | null): boolean {
  if (lastActiveAt === null) return false;
  return Date.now() - lastActiveAt < 7 * 24 * 60 * 60 * 1000;
}

/* ============================================================
   Leader avatar
   ============================================================ */

function LeaderAvatar({ name, imageUrl }: { name: string; imageUrl: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-border-gold"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-medium text-black">
      {initial}
    </span>
  );
}

/* ============================================================
   Leader accountability card
   ============================================================ */

function LeaderCard({ leader }: { leader: LeaderActivity }) {
  const engaged = isEngaged(leader.lastActiveAt);
  const signInLine = humanizeMs(leader.lastSignInAt, 'sign-in');
  const activeLine = humanizeMs(leader.lastActiveAt, 'active');

  return (
    <div className="flex items-start gap-4 rounded-sm border border-border-sub bg-black-3 p-4">
      <LeaderAvatar name={leader.name} imageUrl={leader.imageUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ivory">{leader.name}</p>
          <span
            className={
              'rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ' +
              (engaged
                ? 'border-emerald-lt/30 text-emerald-lt'
                : 'border-gold/30 text-gold')
            }
          >
            {engaged ? 'engaged' : 'quiet'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-silver">{signInLine}. {activeLine}.</p>
        {leader.email && (
          <p className="mt-0.5 text-[11px] text-muted">{leader.email}</p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Page
   ============================================================ */

export default async function MasterGroupDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const data = await getGroupForMaster(orgId);

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/master"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-silver transition-colors hover:text-ivory"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
              <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All groups
          </Link>
        </div>
        <div className="rounded-sm border border-border-sub bg-black-3 px-8 py-16 text-center">
          <p className="font-display text-2xl font-light text-ivory-dim">
            Group not found
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-silver">
            We could not find that group, or you do not have access. It may have been
            removed, or the link may be out of date.
          </p>
          <Link
            href="/dashboard/master"
            className="mt-6 inline-flex items-center gap-1.5 rounded-sm border border-border-sub px-4 py-2 text-xs text-silver transition-colors hover:border-border-gold hover:text-ivory"
          >
            Back to all groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">

      {/* Back link */}
      <div className="mb-8">
        <Link
          href="/dashboard/master"
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-silver transition-colors hover:text-ivory"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
            <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All groups
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-12">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Group
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          {data.orgName}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-silver">
          Everything a leader sees, plus their activity. Walk with the leader so
          they can walk with their people.
        </p>
      </div>

      {/* Leader accountability panel */}
      <section aria-label="Leader accountability" className="mb-14">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Leader accountability
        </p>
        <p className="mb-5 text-sm text-silver">
          Activity reflects Clerk sign-in and session timestamps. Reach out to
          care first, then to ask how the group is doing.
        </p>
        {data.leaders.length === 0 ? (
          <p className="text-sm text-silver">No leaders are assigned to this group yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.leaders.map((leader) => (
              <LeaderCard key={leader.userId} leader={leader} />
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="mb-14 h-px bg-gradient-to-r from-transparent via-border-sub to-transparent" />

      {/* Full group view, same as what the leader sees, with Scripture links. */}
      <GroupOverview
        org={{ id: data.orgId, name: data.orgName }}
        members={data.members}
        group={data.group}
      />
    </div>
  );
}
