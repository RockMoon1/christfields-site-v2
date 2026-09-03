import Link from 'next/link';
import { AvailabilityBoard } from '@/components/dashboard/AvailabilityBoard';
import { getMyAvailability } from './actions';

/**
 * When you are usually free. A leaf reached from You, never a tab. Two things
 * only: tap the times you are usually free, and (optional) paste your calendar
 * link. Your leader sees free or busy, and only on the best times.
 */
export default async function AvailabilityPage() {
  const initial = await getMyAvailability();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/settings" className="mb-4 inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-silver">
        &larr; You
      </Link>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-light text-ivory">When are you usually free?</h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-silver">
          Your leader sees only that you are free, and only on the best times. Never what you are doing.
        </p>
      </header>

      <AvailabilityBoard initial={initial} />
    </div>
  );
}
