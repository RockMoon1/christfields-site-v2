import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PremiumOrb } from '@/components/dashboard/PremiumOrb';
import { TronScrollEffect } from '@/components/dashboard/TronScrollEffect';
import { HeroPanel } from '@/components/dashboard/HeroPanel';
import { StatCard } from '@/components/dashboard/StatCard';
import { TodayRhythms } from '@/components/dashboard/TodayRhythms';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { TextSplit } from '@/components/motion/TextSplit';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { getAreas } from './progress/actions';
import { getRhythms } from './rhythms/actions';
import { getPrayers } from './prayer/actions';
import { getTodayReflect } from './reflect/actions';
import { getScripture } from './scripture/actions';
import { verseForToday } from '@/lib/dashboard/content';

/**
 * Dashboard overview. A living command center: the 3D logo orb and greeting,
 * the verse for today, today's rhythms with one-tap check-off, where today's
 * reflection stands, and quiet snapshots of prayer and Scripture. Everything
 * is real data, and every empty state is an invitation, never a scolding.
 */
export default async function DashboardHome() {
  const [user, areas, rhythms, prayers, reflect, scripture] = await Promise.all([
    currentUser(),
    getAreas(),
    getRhythms(),
    getPrayers(),
    getTodayReflect(),
    getScripture(),
  ]);

  const firstName = user?.firstName || user?.username || 'friend';
  const verse = verseForToday();

  const now = new Date();
  const memberSince = user?.createdAt ? new Date(user.createdAt) : now;
  const daysSinceJoin = Math.max(
    1,
    Math.floor((now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Vitality drives the orb glow (average of latest progress-area scores).
  const latestScores = areas
    .map((a) => a.entries[a.entries.length - 1]?.score)
    .filter((s): s is number => typeof s === 'number');
  const vitality =
    latestScores.length > 0
      ? latestScores.reduce((a, b) => a + b, 0) / latestScores.length
      : 0;

  const dailyRhythms = rhythms.filter((r) => r.cadence === 'daily');
  const keptToday = dailyRhythms.filter((r) => r.doneToday).length;

  const reflectItems = [
    { label: 'Mood', done: !!reflect.mood },
    { label: 'Gratitude', done: !!reflect.gratitude },
    { label: 'Examen', done: !!reflect.examen },
  ];

  return (
    <div className="relative mx-auto max-w-6xl">
      <TronScrollEffect />

      <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block">
        <MorphBlob color="rgba(201, 165, 72, 0.04)" size={620} className="left-1/3 top-1/3" />
        <MorphBlob color="rgba(45, 106, 79, 0.05)" size={520} className="-right-32 top-3/4" />
      </div>

      {/* Hero: greeting + 3D orb */}
      <HeroPanel>
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
              <PulsingDot /> Welcome back
            </p>

            <h2 className="mb-4 font-display text-4xl font-light leading-tight text-ivory md:text-5xl">
              <TextSplit text="Hello, " delay={0.2} />
              <em className="not-italic text-gold-lt">
                <TextSplit text={`${firstName}.`} delay={0.45} />
              </em>
            </h2>

            <p className="max-w-md text-base leading-relaxed text-silver">
              This is your space to walk with God a little more closely. Keep your
              rhythms, take what is on your heart straight to him, and be honest about how you are. There
              is grace here for every day.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <MagneticButton>
                <Link
                  href="/dashboard/rhythms"
                  prefetch
                  className="inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
                >
                  Today&rsquo;s rhythms &rarr;
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/dashboard/reflect"
                  prefetch
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  Reflect
                </Link>
              </MagneticButton>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-[360px] justify-self-end">
            <PremiumOrb
              className="h-full w-full"
              areas={areas.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
              vitality={vitality}
            />
          </div>
        </div>
      </HeroPanel>

      {/* Verse of the day */}
      <section className="relative mb-12 overflow-hidden rounded-sm border border-border-sub bg-gradient-to-br from-black-3 to-black-2 p-8 md:p-10">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
        />
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Verse for today
        </p>
        <blockquote className="max-w-3xl font-display text-2xl font-light leading-relaxed text-ivory md:text-3xl">
          &ldquo;{verse.verse_text}&rdquo;
        </blockquote>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium uppercase tracking-[0.14em] text-gold-lt">
            {verse.reference}
          </span>
          <span className="text-xs text-muted">{verse.translation}</span>
          <Link
            href="/dashboard/scripture"
            prefetch
            className="ml-auto text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
          >
            Scripture &rarr;
          </Link>
        </div>
      </section>

      {/* Stat cards */}
      <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rhythms today"
          value={keptToday}
          hint={dailyRhythms.length > 0 ? `of ${dailyRhythms.length} daily` : 'Set some up'}
          accent="#c9a548"
          index={0}
        />
        <StatCard
          label="Answered prayers"
          value={prayers.answered.length}
          hint="Look what he has done"
          accent="#2d6a4f"
          index={1}
        />
        <StatCard
          label="Verses memorized"
          value={scripture.memorized.length}
          hint="Hidden in your heart"
          accent="#e4c97a"
          index={2}
        />
        <StatCard
          label="Days since you started"
          value={daysSinceJoin}
          hint="Today counts"
          accent="#5b8db8"
          index={3}
        />
      </section>

      {/* Today: rhythms + reflect status */}
      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayRhythms initial={dailyRhythms} />
        </div>
        <ReflectTodayCard items={reflectItems} />
      </section>

      {/* Snapshots */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SnapshotCard
          href="/dashboard/prayer"
          eyebrow="Prayer"
          headline={
            prayers.open.length > 0
              ? `${prayers.open.length} on your heart`
              : 'What is on your heart'
          }
          sub={
            prayers.answered.length > 0
              ? `${prayers.answered.length} answered so far`
              : 'A place to keep them'
          }
          accent="#5b8db8"
        />
        <SnapshotCard
          href="/dashboard/scripture"
          eyebrow="Scripture"
          headline={
            scripture.memorized.length + scripture.learning.length > 0
              ? `${scripture.memorized.length} memorized, ${scripture.learning.length} learning`
              : 'Start hiding the Word'
          }
          sub={scripture.dueCount > 0 ? `${scripture.dueCount} due for review` : 'A verse a week'}
          accent="#e4c97a"
        />
        <SnapshotCard
          href="/dashboard/community"
          eyebrow="Community"
          headline="Carry each other"
          sub="Pray for one another by name"
          accent="#c47b3c"
        />
      </section>
    </div>
  );
}

/* ============================================================
   Small server-rendered helpers.
   ============================================================ */

function ReflectTodayCard({ items }: { items: { label: string; done: boolean }[] }) {
  const allDone = items.every((i) => i.done);
  return (
    <div className="flex h-full flex-col rounded-sm border border-border-sub bg-black-3 p-6">
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        Reflect today
      </p>
      <ul className="flex-1 space-y-3">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                i.done ? 'border-emerald-lt bg-emerald-lt/15 text-emerald-lt' : 'border-border-sub text-muted'
              }`}
            >
              {i.done ? (
                <svg viewBox="0 0 16 16" className="h-3 w-3">
                  <path
                    d="M3.5 8.5l3 3 6-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            <span className={`text-sm ${i.done ? 'text-ivory-dim' : 'text-silver'}`}>{i.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs italic text-muted">
        {allDone ? 'You showed up today. Well done.' : 'A few honest minutes whenever you are ready.'}
      </p>
      <Link
        href="/dashboard/reflect"
        prefetch
        className="mt-3 inline-block text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
      >
        Open reflect &rarr;
      </Link>
    </div>
  );
}

function SnapshotCard({
  href,
  eyebrow,
  headline,
  sub,
  accent,
}: {
  href: string;
  eyebrow: string;
  headline: ReactNode;
  sub: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="group relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6 pl-7 transition-colors hover:border-border-gold"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}55` }}
      />
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
        {eyebrow}
      </p>
      <p className="font-display text-xl font-light leading-snug text-ivory">{headline}</p>
      <p className="mt-2 text-xs text-silver">{sub}</p>
      <span className="mt-4 inline-block text-[11px] font-medium uppercase tracking-[0.07em] text-gold opacity-0 transition-opacity group-hover:opacity-100">
        Open &rarr;
      </span>
    </Link>
  );
}

function PulsingDot() {
  return (
    <span className="relative mr-2 inline-block h-1.5 w-1.5 align-middle">
      <span className="absolute inset-0 animate-ping rounded-full bg-gold opacity-75" />
      <span className="absolute inset-0 rounded-full bg-gold" />
    </span>
  );
}
