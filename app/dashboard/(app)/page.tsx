import { currentUser } from '@clerk/nextjs/server';
import { PremiumOrb } from '@/components/dashboard/PremiumOrb';

/**
 * Dashboard overview. The first thing a member sees after signing in.
 * Premium 3D orb on the right, personal greeting + at-a-glance stats on
 * the left. Empty states are visually rich so the dashboard never feels
 * lifeless even before there is data.
 */
export default async function DashboardHome() {
  const user = await currentUser();
  const firstName = user?.firstName || user?.username || 'friend';

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
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

          {/* 3D orb. Cursor-following gold icosahedron */}
          <div className="relative aspect-square w-full max-w-[360px] justify-self-end">
            <PremiumOrb className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="mb-12 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active areas"
          value="0"
          hint="Start tracking on the Progress page"
        />
        <StatCard
          label="Entries this month"
          value="0"
          hint="Log when something shifts"
        />
        <StatCard
          label="Days since you started"
          value="1"
          hint="Today counts as day one"
        />
      </section>

      {/* Recent activity placeholder */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-display text-2xl font-light text-ivory">Recent activity</h3>
            <p className="mt-1 text-sm text-silver">
              Your last entries and any notes added by Christ Fields.
            </p>
          </div>
        </div>
        <div className="rounded-sm border border-dashed border-border-sub bg-black-3/40 p-12 text-center">
          <p className="font-display text-xl italic text-silver">
            Nothing here yet.
          </p>
          <p className="mt-2 text-sm text-muted">
            Once you start logging progress, your timeline will show up here.
          </p>
        </div>
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
