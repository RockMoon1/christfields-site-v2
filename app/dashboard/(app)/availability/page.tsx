import Link from 'next/link';
import { AvailabilityBoard } from '@/components/dashboard/AvailabilityBoard';
import { getMyAvailability } from './actions';

const NOTICES: Record<string, string> = {
  busy: 'Connected. Your leader can now see when you are free. Only free or busy, never what it is.',
  calendar: 'Connected. A calendar named Christ Fields is now in your Google Calendar.',
  denied: 'No problem. Nothing was connected.',
  error: 'Something went wrong on the way back from Google. Try once more.',
  signin: 'You were signed out along the way. You are back now; tap Connect again.',
  unconfigured: 'Google connect is not switched on for this site yet.',
};

/**
 * When you are usually free. A leaf reached from You or from "I can't make it",
 * never a tab. Tap the times you are usually free, or let a calendar fill it
 * in: Google in one tap, or a pasted link from any calendar. Your leader sees
 * free or busy, and only on the best times.
 */
export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const [initial, sp] = await Promise.all([getMyAvailability(), searchParams]);
  const notice = sp.google ? NOTICES[sp.google] ?? null : null;

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

      {notice && (
        <p className="mb-6 rounded-sm border border-border-gold bg-gold/[0.06] px-4 py-3 text-sm leading-relaxed text-ivory">{notice}</p>
      )}

      <AvailabilityBoard initial={initial} />
    </div>
  );
}
