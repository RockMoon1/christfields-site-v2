import { getMasterOverview } from './actions';
import { MasterBoard } from '@/components/master/MasterBoard';

/**
 * Master Oversight page. Renders inside the master layout which already
 * provides the header, gate, and ambient background. This component is
 * the page content only.
 */
export default async function MasterOversightPage() {
  const data = await getMasterOverview();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-12">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Oversight
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Every group, at a glance
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-silver">
          Walk with the leaders so they can walk with their people. This page
          shows you the health of every FaithFlow group, each leader's
          activity, and the members who may need a gentle hand.
        </p>
      </div>

      {/* State variants */}
      {data.state === 'not-master' && (
        <div className="rounded-sm border border-border-sub bg-black-3 px-8 py-12 text-center">
          <p className="font-display text-2xl font-light text-ivory-dim">
            Master access required
          </p>
          <p className="mt-3 text-sm text-silver">
            Your account does not have master-level access. Contact the site
            administrator if you believe this is a mistake.
          </p>
        </div>
      )}

      {data.state === 'no-groups' && (
        <div className="rounded-sm border border-border-sub bg-black-3 px-8 py-16 text-center">
          <p className="font-display text-3xl font-light text-ivory-dim">
            No groups yet
          </p>
          <p className="mt-4 max-w-md mx-auto text-sm leading-relaxed text-silver">
            No FaithFlow groups exist yet. Once leaders create their groups,
            they will appear here with full health and accountability data.
          </p>
        </div>
      )}

      {data.state === 'ready' && (
        <MasterBoard groups={data.groups} totals={data.totals} />
      )}
    </div>
  );
}
