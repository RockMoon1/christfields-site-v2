import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { PremiumOrb } from '@/components/dashboard/PremiumOrb';
import { TronScrollEffect } from '@/components/dashboard/TronScrollEffect';
import { HeroPanel } from '@/components/dashboard/HeroPanel';
import { StatCard } from '@/components/dashboard/StatCard';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { TextSplit } from '@/components/motion/TextSplit';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { getAreas } from './progress/actions';

/**
 * Dashboard overview. Composes the cursor-following orb, animated hero
 * panel, motion-driven stat cards, and TRON scroll trails into a page
 * that always feels alive. No more recent-activity list — that data is
 * already represented on /dashboard/progress via the sparklines and on
 * the orb webbing through area count and vitality.
 */
export default async function DashboardHome() {
  const [user, areas] = await Promise.all([currentUser(), getAreas()]);
  const firstName = user?.firstName || user?.username || 'friend';

  const totalAreas = areas.length;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const entriesThisMonth = areas.reduce(
    (acc, a) => acc + a.entries.filter((e) => e.date >= startOfMonth).length,
    0,
  );
  const memberSince = user?.createdAt ? new Date(user.createdAt) : now;
  const daysSinceJoin = Math.max(
    1,
    Math.floor(
      (now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  // Vitality drives orb glow.
  const latestScores = areas
    .map((a) => a.entries[a.entries.length - 1]?.score)
    .filter((s): s is number => typeof s === 'number');
  const vitality =
    latestScores.length > 0
      ? latestScores.reduce((a, b) => a + b, 0) / latestScores.length
      : 0;

  return (
    <div className="relative mx-auto max-w-6xl">
      {/* TRON-style scroll trails — edges glow and a midline beam drifts as
          the user scrolls; everything fades back to invisible at rest. */}
      <TronScrollEffect />

      {/* Page-wide ambient blobs that drift behind ALL content. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <MorphBlob
          color="rgba(201, 165, 72, 0.04)"
          size={620}
          className="left-1/3 top-1/3"
        />
        <MorphBlob
          color="rgba(45, 106, 79, 0.05)"
          size={520}
          className="-right-32 top-3/4"
        />
      </div>

      {/* Hero panel: ambient blobs, cursor glow, animated borders, breathing. */}
      <HeroPanel>
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
              <PulsingDot /> Welcome back
            </p>

            {/* Greeting with character-by-character reveal */}
            <h2 className="mb-4 font-display text-4xl font-light leading-tight text-ivory md:text-5xl">
              <TextSplit text="Hello, " delay={0.2} />
              <em className="not-italic text-gold-lt">
                <TextSplit text={`${firstName}.`} delay={0.45} />
              </em>
            </h2>

            <p className="max-w-md text-base leading-relaxed text-silver">
              This is your space. Track the things you are working on. Look back at
              where you started. Be honest with yourself about where you are now.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <MagneticButton>
                <Link
                  href="/dashboard/progress"
                  prefetch
                  className="inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
                >
                  Log progress →
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/dashboard/resources"
                  prefetch
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  Open resources
                </Link>
              </MagneticButton>
            </div>
          </div>

          {/* 3D logo medallion */}
          <div className="relative aspect-square w-full max-w-[360px] justify-self-end">
            <PremiumOrb
              className="h-full w-full"
              areas={areas.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
              vitality={vitality}
            />
          </div>
        </div>
      </HeroPanel>

      {/* Stat cards: stagger entrance, hover lift, cursor glow, pulsing dots. */}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active areas"
          value={totalAreas}
          hint={
            totalAreas === 0
              ? 'Start tracking on the Progress page'
              : 'Things you are working on'
          }
          accent="#c9a548"
          index={0}
        />
        <StatCard
          label="Entries this month"
          value={entriesThisMonth}
          hint="Log when something shifts"
          accent="#2d6a4f"
          index={1}
        />
        <StatCard
          label="Days since you started"
          value={daysSinceJoin}
          hint="Today counts"
          accent="#e4c97a"
          index={2}
        />
      </section>
    </div>
  );
}

/**
 * A tiny pulsing gold dot used as a status indicator next to "Welcome back".
 */
function PulsingDot() {
  return (
    <span className="relative mr-2 inline-block h-1.5 w-1.5 align-middle">
      <span className="absolute inset-0 animate-ping rounded-full bg-gold opacity-75" />
      <span className="absolute inset-0 rounded-full bg-gold" />
    </span>
  );
}
