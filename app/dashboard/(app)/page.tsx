import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { getHomeFeed } from './events/actions';
import { mintIcsToken } from '@/lib/notify/tokens';
import { EventCard } from '@/components/dashboard/EventCard';
import { ChangedStrip } from '@/components/dashboard/ChangedStrip';
import { HomeSlot } from '@/components/dashboard/HomeSlot';
import { whenInWords } from '@/lib/dashboard/format';
import { googleTemplateUrl } from '@/lib/schedule/ics-export';
import { appUrl } from '@/lib/dashboard/prefs';

/**
 * Home. At most four things: what changed, the next event as one big card,
 * the rest as rows, and one card asking one thing. Nothing to learn.
 */
export default async function HomePage() {
  const [feed, { userId }] = await Promise.all([getHomeFeed(), auth()]);
  const base = appUrl();
  const zoneFor = (eventTz: string) => (feed.tz && feed.tz !== 'UTC' ? feed.tz : eventTz);
  const icsToken = (eventId: string, startsAt: string) => (userId ? mintIcsToken(eventId, userId, startsAt) : undefined);

  return (
    <div className="mx-auto max-w-2xl">
      <ChangedStrip lines={feed.changed} tz={feed.tz} />

      {feed.slot?.kind === 'hello' && <HomeSlot card={feed.slot} firstName={feed.firstName} />}

      {feed.next ? (
        <>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">Next up</p>
          <EventCard
            event={feed.next}
            whenText={whenInWords(feed.next.startsAt, zoneFor(feed.next.tz))}
            googleUrl={googleTemplateUrl(feed.next, base)}
            icsToken={icsToken(feed.next.id, feed.next.startsAt)}
            big
            showGroup={feed.multiOrg}
          />
        </>
      ) : (
        <section className="rounded-sm border border-dashed border-border-sub p-8 text-center">
          <p className="font-display text-2xl font-light text-ivory">Nothing planned yet.</p>
          <p className="mt-2 text-base text-silver">Your leader will post soon. You will hear about it.</p>
          {feed.isLeader && (
            <Link
              href="/dashboard/lead/post"
              className="mt-5 inline-flex min-h-[44px] items-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
            >
              Post something
            </Link>
          )}
        </section>
      )}

      {feed.later.length > 0 && (
        <section className="mt-8">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-muted">Later</p>
          <div className="space-y-3">
            {feed.later.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                whenText={whenInWords(e.startsAt, zoneFor(e.tz))}
                googleUrl={googleTemplateUrl(e, base)}
                icsToken={icsToken(e.id, e.startsAt)}
                showGroup={feed.multiOrg}
              />
            ))}
          </div>
        </section>
      )}

      {feed.slot && feed.slot.kind !== 'hello' && (
        <div className="mt-8">
          <HomeSlot card={feed.slot} firstName={feed.firstName} />
        </div>
      )}

      {feed.isLeader && feed.next && (
        <div className="mt-8 flex justify-center lg:hidden">
          <Link
            href="/dashboard/lead/post"
            className="inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black"
          >
            Post something
          </Link>
        </div>
      )}
    </div>
  );
}
