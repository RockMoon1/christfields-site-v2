import Link from 'next/link';
import type { LeadGroup } from '@/app/dashboard/(app)/lead/actions';
import { whenInWords, dateInWords } from '@/lib/dashboard/format';
import { SLOT_LABEL, type Slot } from '@/lib/dashboard/availability';
import { eventTheme } from '@/lib/dashboard/events';

/**
 * One group, this week. The next 14 days with the one number that matters per
 * event, one contextual prompt, and the Say hi list. No scores, no trends.
 */
export function ThisWeek({ group, tz }: { group: LeadGroup; tz: string }) {
  const upcoming = group.events.filter((e) => e.status === 'scheduled');

  return (
    <section className="rounded-sm border border-border-sub bg-black-3 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl font-light text-ivory">{group.orgName}</h3>
        <Link href={`/dashboard/lead/group?org=${encodeURIComponent(group.orgId)}`} className="text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:text-gold-lt">
          Your group &rarr;
        </Link>
      </div>

      <Prompt group={group} tz={tz} />

      {upcoming.length === 0 ? (
        <p className="text-sm text-silver">Nothing posted for the next two weeks.</p>
      ) : (
        <ul className="divide-y divide-border-sub">
          {upcoming.map((e) => {
            const theme = eventTheme(e.type);
            return (
              <li key={e.id} className="py-3">
                <Link href={`/dashboard/e/${e.id}`} className="block hover:text-gold-lt">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span className="text-base text-ivory">{e.title}</span>
                    <span className="text-xs text-muted">{whenInWords(e.startsAt, e.tz)}</span>
                  </div>
                  <p className="mt-1 text-sm text-silver">
                    {e.going} in, {e.maybe} not sure, {e.silent} {e.silent === 1 ? 'has' : 'have'} not answered
                    {e.firstTimers > 0 ? `, ${e.firstTimers} coming for the first time` : ''}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {group.seriesEnding && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border-gold bg-gold/[0.06] px-4 py-3">
          <p className="text-sm text-ivory-dim">
            {group.seriesEnding.title} ends after {dateInWords(group.seriesEnding.lastAt, group.seriesEnding.tz)}.
          </p>
          <Link
            href={`/dashboard/lead/post?org=${encodeURIComponent(group.orgId)}&extend=${encodeURIComponent(group.seriesEnding.eventId)}`}
            className="text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:text-gold-lt"
          >
            Extend it &rarr;
          </Link>
        </div>
      )}

      {group.sayHiReady && group.sayHi.length > 0 && (
        <div className="mt-4 rounded-sm border-l-2 border-gold/60 bg-black-2/60 px-4 py-3">
          <p className="text-sm text-ivory-dim">
            {joinNames(group.sayHi)} {group.sayHi.length === 1 ? 'has' : 'have'} not been to the last two. Worth a hello?
          </p>
        </div>
      )}

      {group.themes.length > 0 && (
        <div className="mt-4 rounded-sm border border-border-sub bg-black-2/60 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">This fortnight the group is carrying</p>
          <p className="mt-1 font-display text-xl text-ivory">{group.themes.map((t) => t.label).join(', ')}</p>
          <ul className="mt-2 space-y-1.5">
            {group.themes.map((t) => (
              <li key={t.key} className="text-sm leading-snug text-silver">
                <span className="text-ivory-dim">{t.passage}.</span> {t.nudge}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Theme words from private reflections. No names, no words, no counts.</p>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        {group.informed} of {group.total} have told us when they are usually free.
      </p>
    </section>
  );
}

function Prompt({ group, tz }: { group: LeadGroup; tz: string }) {
  const p = group.prompt;
  if (p.kind === 'none') return null;

  if (p.kind === 'post') {
    return (
      <div className="mb-4 rounded-sm border border-border-gold bg-gold/[0.06] p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Best time to gather</p>
        <p className="mt-1 font-display text-xl text-ivory">
          {p.dayShort}, {p.dateLabel}, {SLOT_LABEL[p.slot as Slot].toLowerCase()}
        </p>
        <p className="mt-1 text-sm text-silver">
          {p.free} of {p.total} free{p.names.length > 0 ? `: ${p.names.join(', ')}` : ''}
        </p>
        <Link
          href={`/dashboard/lead/post?org=${encodeURIComponent(group.orgId)}&date=${p.iso}&slot=${p.slot}`}
          className="mt-3 inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
        >
          Post this
        </Link>
      </div>
    );
  }

  if (p.kind === 'prep') {
    return (
      <div className="mb-4 rounded-sm border border-border-gold bg-gold/[0.06] p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Coming up</p>
        <p className="mt-1 font-display text-xl text-ivory">
          {p.title}, {whenInWords(p.startsAt, p.tz || tz)}
        </p>
        <Link href={`/dashboard/e/${p.eventId}`} className="mt-3 inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black">
          Who is in, and what might come up
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-sm border border-border-gold bg-gold/[0.06] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Just happened</p>
      <p className="mt-1 font-display text-xl text-ivory">{p.title}</p>
      <Link href={`/dashboard/e/${p.eventId}`} className="mt-3 inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt">
        Who came?
      </Link>
    </div>
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
