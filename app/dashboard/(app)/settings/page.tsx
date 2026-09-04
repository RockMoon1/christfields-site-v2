import Link from 'next/link';
import { getYou } from './actions';
import { EmailToggle, CopyLink } from '@/components/dashboard/YouCards';
import { PushSettingsCard } from '@/components/dashboard/PushSetup';
import { GoogleCards } from '@/components/dashboard/GoogleCards';
import { InstallAppCard } from '@/components/dashboard/InstallAppCard';
import { FeedbackCard } from '@/components/dashboard/FeedbackCard';

/**
 * You. A few plain cards and a quiet footer. The words sync, org, dashboard and
 * availability never appear here. The Google cards render only once the
 * founder has set up the Google Cloud client.
 */
export default async function YouPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const [you, params] = await Promise.all([getYou(), searchParams]);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">You</p>
        <h2 className="font-display text-4xl font-light text-ivory">Your settings.</h2>
      </header>

      <PushSettingsCard />

      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-6">
        <h3 className="font-display text-xl font-light text-ivory">Email me about plans</h3>
        <p className="mt-1 text-sm leading-relaxed text-silver">
          New plans, changes, cancellations, and a reminder the day before. If your phone alerts are working, we
          skip the email for new posts. Turning this off stops all our emails, including cancellations. You will
          still see everything on Home.
        </p>
        <div className="mt-4">
          <EmailToggle initial={you.emailReminders} />
        </div>
      </section>

      <GoogleCards google={you.google} notice={params.google} />

      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-6">
        <h3 className="font-display text-xl font-light text-ivory">{you.google.configured ? 'Or subscribe from any other calendar' : 'Put our events on my calendar'}</h3>
        <p className="mt-1 text-sm leading-relaxed text-silver">
          Subscribe once and every plan shows up in your own calendar app. Changes reach you by notification,
          not by calendar: Google can take hours to notice a change, and a called-off event shows as cancelled
          for a couple of weeks before it disappears.
        </p>
        {you.feedUrl ? (
          <div className="mt-4 space-y-3">
            <CopyLink url={you.feedUrl} />
            <ul className="space-y-1 text-xs leading-relaxed text-muted">
              <li>
                <span className="text-silver">Google Calendar (computer):</span> Other calendars, plus, From URL, paste the link.
              </li>
              <li>
                <span className="text-silver">iPhone:</span> Settings, Apps, Calendar, Accounts, Add Subscribed Calendar. Then set Refresh to
                every 15 minutes.
              </li>
              <li>
                <span className="text-silver">Outlook:</span> Add calendar, Subscribe from web.
              </li>
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Your link is being set up. Come back in a moment.</p>
        )}
      </section>

      <Link
        href="/dashboard/availability"
        className="group mb-6 flex items-center justify-between gap-4 rounded-sm border border-border-sub bg-black-3 p-6 transition-colors hover:border-border-gold"
      >
        <div>
          <h3 className="font-display text-xl font-light text-ivory">When you are usually free</h3>
          <p className="mt-1 text-sm leading-relaxed text-silver">
            {you.hasAvailability
              ? 'Thanks, your leader can plan around you. Tap to change it.'
              : 'Tap the times you are usually free so your leader can pick times that work. Only free or busy, never what it is.'}
          </p>
        </div>
        <span className="text-gold transition-transform group-hover:translate-x-1">&rarr;</span>
      </Link>

      <InstallAppCard />

      <div className="mt-10 border-t border-border-sub pt-6">
        <FeedbackCard />
        <Link href="/dashboard/foundation" className="mt-4 inline-block text-xs text-muted hover:text-silver">
          What we stand for &rarr;
        </Link>
      </div>
    </div>
  );
}
