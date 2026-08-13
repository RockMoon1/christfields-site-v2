import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { isLeaderRole } from '@/lib/faithflow/roles';
import { InstallAppCard } from '@/components/dashboard/InstallAppCard';
import { FeedbackCard } from '@/components/dashboard/FeedbackCard';
import { getJourney } from '@/lib/dashboard/journey-data';
import { isRevealed, type SectionKey } from '@/lib/dashboard/journey';

/** The explore grid, in nav order, each tied to the section that reveals it. */
const EXPLORE: { href: string; label: string; note: string; section: SectionKey }[] = [
  { href: '/dashboard/rhythms', label: 'Rhythms', note: 'Daily and weekly practices', section: 'rhythms' },
  { href: '/dashboard/prayer', label: 'Prayer', note: 'Requests and answered prayers', section: 'prayer' },
  { href: '/dashboard/reflect', label: 'Reflect', note: 'Mood, gratitude, examen', section: 'reflect' },
  { href: '/dashboard/scripture', label: 'Scripture', note: 'Verse of the day and memory', section: 'scripture' },
  { href: '/dashboard/progress', label: 'Progress', note: 'Areas you are growing in', section: 'progress' },
  { href: '/dashboard/community', label: 'Community', note: 'Pray for one another', section: 'community' },
];

export default async function SettingsPage() {
  const user = await currentUser();
  const { orgRole } = await auth();
  // getJourney is request-cached, so this costs nothing extra on this render.
  const view = await getJourney();
  const isLeader = isLeaderRole(orgRole);
  const displayName = user?.firstName || user?.username || 'friend';
  const initial = displayName.charAt(0).toUpperCase();

  // Show only what the walk has actually opened, exactly like the nav does.
  // A static list here handed brand-new members links to pages the rest of the
  // dashboard is deliberately still holding back.
  const explore = EXPLORE.filter((item) => view.revealAll || isRevealed(view.sections[item.section]));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          Your account
        </p>
        <h2 className="font-display text-4xl font-light text-ivory md:text-5xl">
          <em className="not-italic text-gold-lt">Settings.</em>
        </h2>
      </header>

      {/* Profile */}
      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border-gold bg-black-2 font-display text-2xl font-light text-gold-lt">
            {initial}
          </span>
          <div>
            <h3 className="font-display text-2xl font-light text-ivory">
              {user?.firstName || user?.username || 'Not set'} {user?.lastName || ''}
            </h3>
            <p className="text-sm text-silver">
              {user?.primaryEmailAddress?.emailAddress || 'No email on file'}
            </p>
          </div>
        </div>

        <dl className="grid gap-4 border-t border-border-sub pt-6 text-sm md:grid-cols-[160px_1fr]">
          <dt className="text-muted">Member since</dt>
          <dd className="text-ivory">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Today'}
          </dd>
        </dl>

        <div className="mt-8 border-t border-border-sub pt-6">
          <p className="text-xs leading-relaxed text-muted">
            To change your email, password, or profile photo, click your avatar in the top
            right and choose &ldquo;Manage account&rdquo;.
          </p>
        </div>
      </section>

      {/* What we stand for */}
      <Link
        href="/dashboard/foundation"
        className="group mb-6 flex items-center justify-between gap-4 rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold"
      >
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
            What we stand for
          </p>
          <p className="text-sm text-silver">
            What Christ Fields is, what we believe, and why we do the things we do.
          </p>
        </div>
        <span className="text-gold transition-transform group-hover:translate-x-1">&rarr;</span>
      </Link>

      {/* Install as an app (PWA) */}
      <InstallAppCard />

      {/* Feedback — emails the team */}
      <FeedbackCard />

      {/* Your data */}
      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
        <h3 className="mb-4 font-display text-xl font-light text-ivory">Your data</h3>
        <ul className="space-y-3 text-sm leading-relaxed text-silver">
          <li>
            What you write stays yours. The words in your reflections, your gratitude, your
            examen, your mood notes, and any prayer you have not shared are never shown to
            anyone, including your leader.
          </li>
          <li>
            Your leader sees how you are walking, not what you wrote. They can see whether you
            kept your rhythms, the direction your mood is trending, your progress scores, the
            verses you are learning, and whether you were at the gathering. It is how they know
            when to check in on you.
          </li>
          <li>
            Because Scripture memory is meant to be tested out loud, your leader can also send a
            verse back to learning or take it off your list after they test you on it.
          </li>
          <li>
            Anything you post on the Community wall is visible to other signed-in members.
            You choose what to share there.
          </li>
          <li>
            Your data is stored securely and is never sold. This is your quiet place to walk
            with God.
          </li>
        </ul>
      </section>

      {/* Scripture credits. The daily verses are quoted from the ESV, which is
          copyrighted; Crossway's permissions policy allows this many verses
          without written permission provided the notice below appears. Memory
          verses come from the public-domain World English Bible via lib/bible,
          credited here as a courtesy rather than a requirement. */}
      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
        <h3 className="mb-4 font-display text-xl font-light text-ivory">Scripture</h3>
        <p className="mb-3 text-xs leading-relaxed text-muted">
          Scripture quotations marked ESV are from the ESV&reg; Bible (The Holy Bible, English
          Standard Version&reg;), copyright &copy; 2001 by Crossway, a publishing ministry of
          Good News Publishers. Used by permission. All rights reserved.
        </p>
        <p className="text-xs leading-relaxed text-muted">
          Verses marked WEB are from the World English Bible, which is in the public domain.
        </p>
      </section>

      {/* Explore */}
      <section className="rounded-sm border border-border-sub bg-black-3 p-8">
        <h3 className="mb-5 font-display text-xl font-light text-ivory">Your dashboard</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {explore.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="group rounded-sm border border-border-sub bg-black-2 p-4 transition-colors hover:border-border-gold"
            >
              <p className="text-sm text-ivory transition-colors group-hover:text-gold-lt">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-muted">{item.note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Leader access. Shown only to FaithFlow leaders. This is the reliable
          way into the leader dashboard from a phone, so it does not depend on
          the avatar menu or the nav drawer. */}
      {isLeader && (
        <section className="mt-6 rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
            FaithFlow Leader
          </p>
          <h3 className="mb-3 font-display text-xl font-light text-ivory">Lead your small group</h3>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-silver">
            See how each person in your small group is walking, and find prayerful,
            Scripture-rooted ways to shepherd them. Built for phone, tablet, and desktop.
          </p>
          <Link
            href="/dashboard/leader"
            className="inline-flex items-center gap-2 rounded-sm border border-border-gold bg-gold/[0.08] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-gold-lt transition-colors hover:bg-gold/[0.16]"
          >
            Enter Leader dashboard &rarr;
          </Link>
        </section>
      )}
    </div>
  );
}
