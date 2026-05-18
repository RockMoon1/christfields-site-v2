import { currentUser } from '@clerk/nextjs/server';
import { PremiumOrb } from '@/components/dashboard/PremiumOrb';
import { getAreas } from './progress/actions';

/**
 * Dashboard overview. The first thing a member sees after signing in.
 * Premium 3D orb on the right, personal greeting + at-a-glance stats on
 * the left. Stats are real, pulled from the user's actual data.
 */
export default async function DashboardHome() {
  const user = await currentUser();
  const firstName = user?.firstName || user?.username || 'friend';

  // Pull real data for the stat cards.
  const areas = await getAreas();
  const totalAreas = areas.length;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const entriesThisMonth = areas.reduce(
    (acc, a) => acc + a.entries.filter((e) => e.date >= startOfMonth).length,
    0,
  );
  const memberSince = user?.createdAt ? new Date(user.createdAt) : now;
  const daysSinceJoin = Math.max(
    1,
    Math.floor((now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <section className="relative mb-12 overflow-hidden rounded-sm border border-border-sub bg-gradient-to-br from-black-3 to-black-2">
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
              Welcome back
            </p>
            <h2 className="mb-4 font-display text-4xl font-light leading-tight text-ivory md:text-5xl">
              Hello, <em className="not-italic text-gold-lt">{firstName}</em>.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-silver">
              This is your space. Track the things you are working on. Look back at where
              you started. Be honest with yourself about where you are now.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/dashboard/progress"
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
              >
                Log progress →
              </a>
              <a
                href="/dashboard/notes"
                className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Notes from your group
              </a>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-[360px] justify-self-end">
            <PremiumOrb className="h-full w-full" />
          </div>
        </div>
      </section>

      <section className="mb-12 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active areas"
          value={String(totalAreas)}
          hint={totalAreas === 0 ? 'Start tracking on the Progress page' : 'Things you are working on'}
        />
        <StatCard
          label="Entries this month"
          value={String(entriesThisMonth)}
          hint="Log when something shifts"
        />
        <StatCard
          label="Days since you started"
          value={String(daysSinceJoin)}
          hint="Today counts"
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-display text-2xl font-light text-ivory">Recent activity</h3>
            <p className="mt-1 text-sm text-silver">
              Your last entries and any notes added by Christ Fields.
            </p>
          </div>
        </div>
        {totalAreas === 0 ? (
          <div className="rounded-sm border border-dashed border-border-sub bg-black-3/40 p-12 text-center">
            <p className="font-display text-xl italic text-silver">Nothing here yet.</p>
            <p className="mt-2 text-sm text-muted">
              Once you start logging progress, your timeline will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-sub overflow-hidden rounded-sm border border-border-sub bg-black-3">
            {flattenRecent(areas, 6).map((row) => (
              <li
                key={`${row.areaId}-${row.date}-${row.score}`}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">{row.areaName}</p>
                  <p className="text-xs text-muted">{formatDate(row.date)}</p>
                </div>
                <p className="font-display text-2xl font-light text-gold-lt">
                  {row.score}
                  <span className="ml-1 text-xs text-muted">/ 10</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <p className="font-display text-4xl font-light text-gold-lt">{value}</p>
      <p className="mt-3 text-xs text-silver">{hint}</p>
    </div>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

function flattenRecent(
  areas: { id: string; name: string; entries: { score: number; date: string }[] }[],
  limit: number,
) {
  const rows: { areaId: string; areaName: string; score: number; date: string }[] = [];
  for (const a of areas) {
    for (const e of a.entries) {
      rows.push({ areaId: a.id, areaName: a.name, score: e.score, date: e.date });
    }
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return rows.slice(0, limit);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
