'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { refreshGroupBusy } from '@/app/dashboard/(app)/lead/actions';

function ago(iso: string | null, nowMs: number): string {
  if (!iso) return 'not yet';
  const min = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 60_000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  return `${Math.round(h / 24)} days ago`;
}

/**
 * Pull the connected calendars again, now. Once every ten minutes per group so
 * a tap-happy leader cannot run up Google or the pasted links; the hourly job
 * covers the rest. The relative time is computed after mount so the server
 * and the browser never disagree about "just now".
 */
export function RefreshBusy({ orgId, lastRefreshedAt }: { orgId: string; lastRefreshedAt: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [line, setLine] = useState<string | null>(null);
  const [agoText, setAgoText] = useState<string | null>(null);

  useEffect(() => {
    setAgoText(ago(lastRefreshedAt, Date.now()));
  }, [lastRefreshedAt]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      <span>{agoText ? `Calendars checked ${agoText}.` : 'Connected calendars are checked every hour.'}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await refreshGroupBusy(orgId).catch(() => ({ ok: false as const, attempted: 0, refreshed: 0, retryInSec: 0 }));
            if (!res.ok) {
              setLine(
                res.retryInSec
                  ? `Checked recently. Try again in ${Math.max(1, Math.ceil(res.retryInSec / 60))} min.`
                  : 'Could not check right now.',
              );
              return;
            }
            if (res.attempted === 0) setLine('Nothing to check yet: nobody has connected a calendar.');
            else if (res.refreshed === res.attempted) setLine(`Checked ${res.refreshed} ${res.refreshed === 1 ? 'calendar' : 'calendars'}.`);
            else if (res.refreshed === 0) setLine(`Tried ${res.attempted} ${res.attempted === 1 ? 'calendar' : 'calendars'}; none answered. The hourly check will try again.`);
            else setLine(`Checked ${res.refreshed} of ${res.attempted}; the rest did not answer in time.`);
            router.refresh();
          })
        }
        className="inline-flex min-h-[36px] items-center rounded-sm border border-border-sub px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-silver hover:border-border-gold hover:text-ivory disabled:opacity-60"
      >
        {pending ? 'Checking' : 'Check again'}
      </button>
      {line && <span className="text-silver">{line}</span>}
    </div>
  );
}
