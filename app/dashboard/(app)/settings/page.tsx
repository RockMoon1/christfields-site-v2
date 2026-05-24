import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { isLeaderRole } from '@/lib/faithflow/roles';

export default async function SettingsPage() {
  const user = await currentUser();
  const { orgRole } = await auth();
  const isLeader = isLeaderRole(orgRole);
  const displayName = user?.firstName || user?.username || 'friend';
  const initial = displayName.charAt(0).toUpperCase();

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

      {/* Your data */}
      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
        <h3 className="mb-4 font-display text-xl font-light text-ivory">Your data</h3>
        <ul className="space-y-3 text-sm leading-relaxed text-silver">
          <li>
            Your rhythms, prayers, reflections, gratitude, and verses are private to you.
            Only you can see them here.
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

      {/* Explore */}
      <section className="rounded-sm border border-border-sub bg-black-3 p-8">
        <h3 className="mb-5 font-display text-xl font-light text-ivory">Your dashboard</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { href: '/dashboard/rhythms', label: 'Rhythms', note: 'Daily and weekly practices' },
            { href: '/dashboard/prayer', label: 'Prayer', note: 'Requests and answered prayers' },
            { href: '/dashboard/reflect', label: 'Reflect', note: 'Mood, gratitude, examen' },
            { href: '/dashboard/scripture', label: 'Scripture', note: 'Verse of the day and memory' },
            { href: '/dashboard/progress', label: 'Progress', note: 'Areas you are growing in' },
            { href: '/dashboard/community', label: 'Community', note: 'Pray for one another' },
          ].map((item) => (
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
          the avatar menu or the nav drawer. Master oversight is intentionally
          NOT placed here: masters reach it from inside the leader area, so
          regular members and non-master leaders never see it. */}
      {isLeader && (
        <section className="mt-6 rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
            FaithFlow Leader
          </p>
          <h3 className="mb-3 font-display text-xl font-light text-ivory">Lead your group</h3>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-silver">
            See how each person in your group is walking, and find prayerful,
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
