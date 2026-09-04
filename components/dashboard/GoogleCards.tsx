'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { disconnectGoogle } from '@/app/dashboard/(app)/settings/actions';

/**
 * The two Google consent cards on You. Each asks for exactly one thing, in
 * Google's own words for the read side: only free or busy, never what it is.
 * Never shown on first run; a member finds them when they go looking.
 */
export interface GoogleStatus {
  configured: boolean;
  write: boolean;
  busy: boolean;
  status: 'ok' | 'revoked' | 'error' | null;
  /** Set when the last hourly check hit a problem; the connection still works. */
  lastError: string | null;
}

const NOTICES: Record<string, string> = {
  calendar: 'Connected. A calendar named Christ Fields is now in your Google Calendar. If you do not see it, tick it in the calendar list on the left.',
  busy: 'Connected. Your leader can now see when you are free. Only free or busy, never what it is.',
  denied: 'No problem. Nothing was connected.',
  error: 'Something went wrong on the way back from Google. Try once more.',
  signin: 'You were signed out along the way. You are back now; tap Connect again.',
  unconfigured: 'Google connect is not switched on for this site yet.',
  disconnected: 'Disconnected. The Christ Fields calendar was removed from your Google Calendar.',
  disconnected_manual:
    'Disconnected on our side, but Google could not be reached to remove the Christ Fields calendar. In Google Calendar, open its settings and choose Delete.',
};

export function GoogleCards({ google, notice }: { google: GoogleStatus; notice?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [line, setLine] = useState<string | null>(notice ? NOTICES[notice] ?? null : null);
  if (!google.configured) return null;
  const connected = google.write || google.busy;
  // Anything but a healthy row means "connect again" fixes it.
  const broken = google.status !== null && google.status !== 'ok';

  const connectButton = (feature: 'write' | 'busy', label: string) => (
    <a
      href={`/api/google/connect?feature=${feature}`}
      className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
    >
      {label}
    </a>
  );

  return (
    <>
      {line && (
        <p className="mb-4 rounded-sm border border-border-gold bg-gold/[0.06] px-4 py-3 text-sm leading-relaxed text-ivory">{line}</p>
      )}
      {broken && (
        <p className="mb-4 rounded-sm border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm leading-relaxed text-ivory">
          {google.status === 'revoked'
            ? 'Google disconnected us (you may have removed the access in your Google account). Connect again below when you like.'
            : 'We lost our connection to your Google account. Connect again below to pick up where it left off.'}
        </p>
      )}

      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-6">
        <h3 className="font-display text-xl font-light text-ivory">Put our events on your Google Calendar</h3>
        <p className="mt-1 text-sm leading-relaxed text-silver">
          One tap and every plan appears on a calendar called Christ Fields inside your Google Calendar, updated when a
          leader changes or calls something off. We can only touch that one calendar, never your own.
        </p>
        <div className="mt-4">
          {google.write && !broken ? (
            <p className="text-sm text-gold-lt">Connected. Look for the Christ Fields calendar in your list; tick it if it is hidden.</p>
          ) : (
            connectButton('write', google.write ? 'Connect again' : 'Connect Google Calendar')
          )}
        </div>
      </section>

      <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-6">
        <h3 className="font-display text-xl font-light text-ivory">Help your leader pick a time</h3>
        <p className="mt-1 text-sm leading-relaxed text-silver">
          Let us check your Google Calendar for the next four weeks so the best times show up for your leader. We only
          ever see free or busy. Never what it is.
        </p>
        <div className="mt-4">
          {google.busy && !broken ? (
            <p className="text-sm text-gold-lt">Connected. We check regularly, usually every hour.</p>
          ) : (
            connectButton('busy', google.busy ? 'Connect again' : 'Share free or busy')
          )}
        </div>
      </section>

      {connected && (
        <div className="-mt-2 mb-6 flex items-center justify-between gap-4">
          <p className="text-xs text-muted">
            {google.lastError && !broken ? 'Our last check hit a snag; we will try again within the hour.' : ''}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await disconnectGoogle().catch(() => ({ ok: false, calendarRemoved: null as boolean | null }));
                setLine(!res.ok ? NOTICES.error : res.calendarRemoved === false ? NOTICES.disconnected_manual : NOTICES.disconnected);
                router.refresh();
              })
            }
            className="min-h-[44px] px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-red-300 disabled:opacity-60"
          >
            {pending ? 'Disconnecting' : 'Disconnect Google'}
          </button>
        </div>
      )}
    </>
  );
}
