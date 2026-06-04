import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { verseForToday } from '@/lib/dashboard/content';
import { getRhythms } from '../rhythms/actions';
import { TodayFocus } from '@/components/dashboard/TodayFocus';
import { MorphBlob } from '@/components/motion/MorphBlob';

/**
 * "Today" — the calm front door (the LLM Council's build-now verdict, 2026-06-03).
 *
 * Instead of meeting the full multi-feature dashboard, a member lands here: the
 * day's verse as the anchor, ONE next practice as a single big tap-target, and a
 * clear, kind stopping point ("That is enough for today. Well done."). Everything
 * else is one quiet link away — "Open the full dashboard". This is the canonical
 * post-login home; the rich Overview is demoted behind that link.
 *
 * It reuses the EXACT loaders the Overview already uses (verseForToday, getRhythms)
 * and the existing toggleToday mutation, so there is no new backend, secret, CSP,
 * or data path. Pure composition of what we already have.
 */
export default async function TodayPage() {
  const [user, rhythms] = await Promise.all([currentUser(), getRhythms()]);
  const firstName = user?.firstName || user?.username || 'friend';
  const verse = verseForToday();

  const daily = rhythms.filter((r) => r.cadence === 'daily');
  const next = daily.find((r) => !r.doneToday) ?? null;
  const allDone = daily.length > 0 && daily.every((r) => r.doneToday);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block">
        <MorphBlob color="rgba(201, 165, 72, 0.05)" size={520} className="-left-24 -top-16" />
        <MorphBlob color="rgba(45, 106, 79, 0.05)" size={460} className="-right-24 top-2/3" />
      </div>

      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Today</p>
      <h1 className="mb-6 font-display text-3xl font-light leading-tight text-ivory sm:text-4xl">
        Good to see you, <em className="not-italic text-gold-lt">{firstName}.</em>
      </h1>

      {/* The verse, the anchor of the day. */}
      <section className="relative mb-5 overflow-hidden rounded-md border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6 md:p-8">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
        />
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Verse for today
        </p>
        <blockquote className="font-display text-2xl font-light leading-relaxed text-ivory md:text-[1.7rem]">
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

      {/* One thing for today: the single next practice, or a kind stopping point. */}
      <TodayFocus
        next={
          next
            ? { id: next.id, name: next.name, anchor: next.anchor, scripture: next.scripture }
            : null
        }
        allDone={allDone}
        hasRhythms={daily.length > 0}
      />

      {/* Everything else, one quiet tap away. */}
      <div className="mt-8 flex items-center justify-center">
        <Link
          href="/dashboard"
          prefetch
          className="inline-flex items-center gap-2 rounded-sm border border-border-sub px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
        >
          Open the full dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}
