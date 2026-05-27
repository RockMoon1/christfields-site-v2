import { AvailabilityBoard } from '@/components/dashboard/AvailabilityBoard';
import { getMyAvailability } from './actions';

/**
 * Member availability page. Set when you are usually free and override specific
 * dates, so your leaders can find a time that works for the whole group.
 */
export default async function AvailabilityPage() {
  const initial = await getMyAvailability();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
          When you can gather
        </p>
        <h2 className="font-display text-4xl font-light text-ivory md:text-5xl">
          Your <em className="not-italic text-gold-lt">availability.</em>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver">
          Let your leaders know when you are usually free so they can plan gatherings everyone can
          actually make. They only ever see free or busy, never what you are doing.
        </p>
      </header>

      {/* Step 2 teaser: connecting a calendar to fill this in automatically. */}
      <section className="mb-8 rounded-sm border border-dashed border-border-sub bg-black-3/50 p-5">
        <p className="text-sm text-silver">
          <span className="font-medium text-ivory">Coming soon:</span> connect your Google, Apple, or
          Outlook calendar with a private link and your busy times will fill in here automatically.
          For now, set your availability by hand below.
        </p>
      </section>

      <AvailabilityBoard initial={initial} />
    </div>
  );
}
