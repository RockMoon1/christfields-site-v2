import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GlobeHero } from '@/components/dashboard/GlobeHero';
import { TronScrollEffect } from '@/components/dashboard/TronScrollEffect';
import { HeroPanel } from '@/components/dashboard/HeroPanel';
import { StatCard } from '@/components/dashboard/StatCard';
import { TodayRhythms } from '@/components/dashboard/TodayRhythms';
import { AttendanceCheckIn } from '@/components/dashboard/AttendanceCheckIn';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { TextSplit } from '@/components/motion/TextSplit';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { getAreas } from './progress/actions';
import { getRhythms } from './rhythms/actions';
import { getPrayers } from './prayer/actions';
import { getTodayReflect } from './reflect/actions';
import { getScripture } from './scripture/actions';
import { getMyAttendance } from './attendance/actions';
import { getMyEvents } from './events/actions';
import { EventBanner } from '@/components/dashboard/EventBanner';
import { ScrollReveal } from '@/components/dashboard/ScrollReveal';
import { verseForToday } from '@/lib/dashboard/content';
import { getJourney } from '@/lib/dashboard/journey-data';
import { isRevealed, isFull } from '@/lib/dashboard/journey';

/**
 * Dashboard overview. A calm, Scripture-first home that grows with the member.
 *
 * Ordering reflects the authority hierarchy and the research on what helps:
 * Scripture sits at the very top as the anchor, then the greeting, then the
 * in-person heartbeat, one clear gentle action, and a compact tap-to-go grid.
 * It is deliberately SHORT at the start (the evidence says fatigue and
 * abandonment, never under-use, are what hurt people), and it expands only as
 * the walk deepens. Nothing is ever a scolding; every empty state is an
 * invitation, and there is no number here to fail at.
 */
export default async function DashboardHome() {
  const [user, view, areas, rhythms, prayers, reflect, scripture, attendance, events] =
    await Promise.all([
      currentUser(),
      getJourney(),
      getAreas(),
      getRhythms(),
      getPrayers(),
      getTodayReflect(),
      getScripture(),
      getMyAttendance(),
      getMyEvents(),
    ]);

  const firstName = user?.firstName || user?.username || 'friend';
  const verse = verseForToday();
  const { sections } = view;
  const seed = view.journey.stage === 'seed';

  const now = new Date();
  const memberSince = user?.createdAt ? new Date(user.createdAt) : now;
  const daysSinceJoin = Math.max(
    1,
    Math.floor((now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Each area's latest score decides how many of its colored raindrops fall
  // on the globe: the member's progress literally waters the seed.
  const globeAreas = areas.map((a) => ({
    id: a.id,
    name: a.name,
    color: a.color,
    score: a.entries[a.entries.length - 1]?.score ?? 0,
  }));

  const dailyRhythms = rhythms.filter((r) => r.cadence === 'daily');
  const keptToday = dailyRhythms.filter((r) => r.doneToday).length;

  const reflectItems = [
    { label: 'Mood', done: !!reflect.mood },
    { label: 'Gratitude', done: !!reflect.gratitude },
    { label: 'Examen', done: !!reflect.examen },
  ];

  // What to reveal, from the journey.
  const showStats = isFull(sections.overview);
  const showRhythms = isRevealed(sections.rhythms);
  const showReflectCard = isRevealed(sections.reflect);
  const showPrayer = isRevealed(sections.prayer);
  const showScripture = isRevealed(sections.scripture);
  const showCommunity = isRevealed(sections.community);
  const showProgress = isRevealed(sections.progress);

  // Compact tap-to-go tiles for the places the member has unlocked. This is the
  // hub that replaces a long scroll: one tap to anywhere, with a little live
  // status. Scripture is always first (the anchor), then the rest as they open.
  const tiles = [
    showScripture && {
      href: '/dashboard/scripture',
      eyebrow: 'Scripture',
      headline:
        scripture.memorized.length + scripture.learning.length > 0
          ? `${scripture.memorized.length} memorized, ${scripture.learning.length} learning`
          : 'Hide the Word in your heart',
      sub: scripture.dueCount > 0 ? `${scripture.dueCount} due for review` : 'A verse a week',
      accent: '#e4c97a',
    },
    showCommunity && {
      href: '/dashboard/community',
      eyebrow: 'Community',
      headline: 'Carry each other',
      sub: 'Pray for one another by name',
      accent: '#c47b3c',
    },
    showRhythms && {
      href: '/dashboard/rhythms',
      eyebrow: 'Rhythms',
      headline: dailyRhythms.length > 0 ? `${keptToday} of ${dailyRhythms.length} kept today` : 'A gentle daily practice',
      sub: 'Faithfulness, not perfection',
      accent: '#c9a548',
    },
    showPrayer && {
      href: '/dashboard/prayer',
      eyebrow: 'Prayer',
      headline: prayers.open.length > 0 ? `${prayers.open.length} on your heart` : 'What is on your heart',
      sub: prayers.answered.length > 0 ? `${prayers.answered.length} answered so far` : 'A place to keep them',
      accent: '#5b8db8',
    },
    showReflectCard && {
      href: '/dashboard/reflect',
      eyebrow: 'Reflect',
      headline: 'A few honest minutes',
      sub: 'Mood, gratitude, examen',
      accent: '#7e6ba8',
    },
    showProgress && {
      href: '/dashboard/progress',
      eyebrow: 'Progress',
      headline: 'Name where you are',
      sub: 'Honesty over time',
      accent: '#2d6a4f',
    },
  ].filter(Boolean) as {
    href: string;
    eyebrow: string;
    headline: string;
    sub: string;
    accent: string;
  }[];

  return (
    <div className="relative mx-auto max-w-6xl">
      <TronScrollEffect />

      <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block">
        <MorphBlob color="rgba(201, 165, 72, 0.04)" size={620} className="left-1/3 top-1/3" />
        <MorphBlob color="rgba(45, 106, 79, 0.05)" size={520} className="-right-32 top-3/4" />
      </div>

      {/* Events banner. Renders only when the member's group has an upcoming event. */}
      <EventBanner events={events} />

      {/* Scripture, first. The anchor of everything, at the very top. */}
      <section className="relative mb-5 overflow-hidden rounded-md border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6 md:mb-8 md:p-9">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
        />
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Verse for today
        </p>
        <blockquote className="max-w-3xl font-display text-2xl font-light leading-relaxed text-ivory md:text-3xl">
          &ldquo;{verse.verse_text}&rdquo;
        </blockquote>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-medium uppercase tracking-[0.14em] text-gold-lt">
            {verse.reference}
          </span>
          <span className="text-xs text-muted">{verse.translation}</span>
          <Link
            href="/dashboard/scripture/context"
            prefetch
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
          >
            Read in context &rarr;
          </Link>
        </div>
      </section>

      {/* Greeting + 3D orb. Compact on phones so the page stays short. */}
      <HeroPanel>
        <div className="grid items-center gap-4 p-6 sm:gap-6 md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
              <PulsingDot /> {seed ? 'Welcome' : 'Welcome back'}
            </p>

            <h2 className="mb-4 font-display text-3xl font-light leading-tight text-ivory sm:text-4xl md:text-5xl">
              <TextSplit text="Hello, " delay={0.2} />
              <em className="not-italic text-gold-lt">
                <TextSplit text={`${firstName}.`} delay={0.45} />
              </em>
            </h2>

            <p className="max-w-md text-sm leading-relaxed text-silver md:text-base">
              {seed
                ? 'This is your space, and there is no rush. Begin with the Word above, and come and be known by people in person. There is grace for every day.'
                : 'This is your space to walk with God a little more closely. Stay in the Word, take what is on your heart to him, and keep showing up with your people. There is grace here for every day.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <MagneticButton>
                <Link
                  href={seed ? '/dashboard/foundation' : '/dashboard/rhythms'}
                  prefetch
                  className="inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
                >
                  {seed ? 'What we stand for' : 'Today’s rhythms'} &rarr;
                </Link>
              </MagneticButton>
              {showCommunity && (
                <MagneticButton>
                  <Link
                    href="/dashboard/community"
                    prefetch
                    className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                  >
                    Your community
                  </Link>
                </MagneticButton>
              )}
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-[180px] justify-self-center sm:max-w-[280px] md:max-w-[360px] md:justify-self-end">
            <GlobeHero
              className="h-full w-full"
              areas={globeAreas}
              stage={view.journey.stage}
            />
          </div>
        </div>
      </HeroPanel>

      {/* In person — the heartbeat. */}
      <section className="mt-5 md:mt-8">
        <AttendanceCheckIn initial={attendance} />
      </section>

      {/* One clear daily action: today's rhythms once they have unlocked, with
          the reflect tile beside it when revealed. Hidden entirely at seed so
          the start stays quiet. */}
      {showRhythms && (
        <section className={cn('mt-5 grid gap-4 md:mt-8', showReflectCard && 'lg:grid-cols-3')}>
          <div className={cn(showReflectCard && 'lg:col-span-2')}>
            <TodayRhythms initial={dailyRhythms} />
          </div>
          {showReflectCard && <ReflectTodayCard items={reflectItems} />}
        </section>
      )}

      {/* Compact tap-to-go grid: everywhere the member has unlocked, one tap
          away, with a little live status. Replaces the long scrolling stack.
          Folded away at seed: a newcomer should not meet a wall of tiles, and
          the bottom tab bar already carries Scripture and Groups. */}
      {!seed && tiles.length > 0 && (
        <ScrollReveal className="mt-5 md:mt-8">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {tiles.map((t) => (
              <SnapshotCard
                key={t.href}
                href={t.href}
                eyebrow={t.eyebrow}
                headline={t.headline}
                sub={t.sub}
                accent={t.accent}
              />
            ))}
          </section>
        </ScrollReveal>
      )}

      {/* Stat cards — only once the member is growing (full overview). */}
      {showStats && (
        <ScrollReveal className="mt-5 md:mt-8">
          <section className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
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
        </ScrollReveal>
      )}

      {/* Seed only: a calm, honest note that this space is meant to be small at
          first and unfolds as you walk. Keeps newcomers from feeling there is a
          mountain of work, and frames the simplicity as intentional. */}
      {seed && (
        <section className="mt-5 rounded-md border border-border-sub bg-black-3/60 p-6 md:mt-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
            This is the whole space, for now
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-ivory-dim">
            We keep it simple on purpose. Start with the verse above, and come be known by people
            in person. As you walk, this space quietly opens up, a little more at a time. Nothing to
            keep up with, nothing to fall behind on.
          </p>
          <Link
            href="/dashboard/foundation"
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:text-gold-lt"
          >
            What we stand for &rarr;
          </Link>
        </section>
      )}
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
