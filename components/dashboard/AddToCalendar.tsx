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
        className="inline-flex min-h-11 max-w-full items-center rounded-sm bg-gold px-4 py-2 text-sm font-medium leading-relaxed text-black transition-colors duration-200 hover:bg-gold-lt focus-visible:bg-gold-lt"
      >
        Put it on my Google Calendar
      </a>
      <a
        href={ics}
        className="inline-flex min-h-11 max-w-full items-center rounded-sm border border-border-sub px-4 py-2 text-sm font-medium leading-relaxed text-silver transition-colors duration-200 hover:border-ivory/40 hover:text-ivory focus-visible:border-ivory/40 focus-visible:text-ivory"
      >
        Apple or Outlook
      </a>
    </div>
  );
}
