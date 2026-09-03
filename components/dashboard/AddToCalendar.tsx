/**
 * Put it on my calendar. Two links, no account, no permission screen: the
 * Google Calendar template link, and an .ics download for Apple and Outlook.
 * The subscribe-to-everything link lives on the You screen.
 */
export function AddToCalendar({ eventId, googleUrl, token }: { eventId: string; googleUrl: string; token?: string }) {
  const ics = `/api/ics/event/${eventId}${token ? `?t=${encodeURIComponent(token)}` : ''}`;
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-gold-lt"
      >
        Put it on my Google Calendar
      </a>
      <a
        href={ics}
        className="inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:border-ivory/40 hover:text-ivory"
      >
        Apple or Outlook
      </a>
    </div>
  );
}
