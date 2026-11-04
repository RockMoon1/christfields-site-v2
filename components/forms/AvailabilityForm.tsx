'use client';
import { useRef, useState, type FormEvent } from 'react';
import { POLL_DATES, dateLabel } from '@/lib/forms/availability';
const field = 'mt-2 min-h-12 w-full rounded-lg border border-white/25 bg-[#101612] px-3 py-3 text-base text-[#f5f1e7] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#dbc28a]';
export default function AvailabilityForm() {
  const [days, setDays] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const id = useRef<string | null>(null);
  const pending = useRef<object | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    id.current ??= crypto.randomUUID();
    // Keep the exact payload after an uncertain network failure. Never silently
    // change an already accepted answer under the same idempotency key.
    pending.current ??= { submissionId: id.current, name: data.get('name'), interest: data.get('interest'), notes: data.get('notes'), website: data.get('website'), consent: data.get('consent') === 'on', ageConfirmed: data.get('ageConfirmed') === 'on', available: POLL_DATES.filter(d => days[d] === 'yes'), unavailable: POLL_DATES.filter(d => days[d] === 'no') };
    try {
      const response = await fetch('/api/forms/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending.current) });
      const result = await response.json();
      if (response.ok && result.ok) { setDone(true); return; }
      if ([400, 413, 415].includes(response.status)) pending.current = null;
      setError(result.error || 'Could not confirm your response. Retry to send the same answers.');
    } catch { setError('Connection interrupted. Your answers are still here. Retry to send the same answers without duplicating your response.'); }
    finally { locked.current = false; setBusy(false); }
  }
  if (done) return <section role="status" className="my-8 rounded-xl border border-[#dbc28a]/40 bg-[#1b251e] p-8"><h2 className="font-display text-4xl">You’re on the planning list.</h2><p className="mt-4 leading-relaxed">Your response is saved for the organizer. This does not confirm a trip or ticket. Look for the final plan in the group.</p><p className="mt-3 text-sm text-[#c3ccc5]">Need to correct or delete your response? Email proverbs@christfields2717.com with your name and this poll’s title.</p></section>;
  return <form onSubmit={submit} className="mt-8 space-y-7">
    <aside aria-label="Privacy and cookies" className="rounded-xl border border-white/20 bg-[#1b251e] p-5 text-sm leading-relaxed text-[#c3ccc5]">
      <h2 className="mb-2 font-semibold text-[#f5f1e7]">Before you share</h2>
      <p>Christ Fields collects the name you provide, attendance interest, date choices, and optional scheduling notes to plan this Iron and Ember activity. Responses are stored in Supabase for the organizer’s private dashboard and may be sent through Resend to proverbs@christfields2717.com. Other visitors cannot see them. Participation is optional.</p>
      <p className="mt-3">This form adds no advertising or analytics cookies. Hosting providers process technical request information, including IP addresses, for delivery and security; we use a daily hashed IP identifier for abuse limits. The signed-in dashboard uses necessary sign-in cookies. See the <a href="/privacy" className="underline">privacy policy</a> and contact the organizer for access, corrections, or deletion. Closing a poll does not automatically delete its stored responses or email copies.</p>
      <p className="mt-3">This site is for ages 13 and older. Under 13? Do not enter personal information here; ask a parent or guardian to contact the organizer. If you’re under 18, involve a parent or guardian in trip planning. Submitting this poll is not parental permission to attend.</p>
    </aside>
    <fieldset disabled={busy || !!pending.current} className="space-y-7 disabled:opacity-70">
      <legend className="sr-only">Your availability</legend>
      <label className="block font-medium">Your name <span className="text-sm font-normal text-[#b7c1b9]">(first name and last initial is fine)</span><input name="name" required maxLength={80} autoComplete="name" className={field} /></label>
      <label className="block font-medium">Interested in coming?<select name="interest" required className={field} defaultValue=""><option value="" disabled>Choose one</option><option value="yes">Yes, I’d like to go</option><option value="maybe">Maybe — depends on the plan</option><option value="no">I can’t make it this time</option></select></label>
      <section aria-labelledby="days-heading"><h2 id="days-heading" className="font-display text-3xl">Which days work?</h2><p className="mt-2 text-sm text-[#b7c1b9]">November 2026 dates in Colorado. Leave days as “Not sure” if you don’t know; we won’t count those as available.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{POLL_DATES.map(date => <label key={date} className="flex items-center justify-between gap-3 rounded-lg border border-white/15 p-3"><span className="text-sm">{dateLabel(date)}</span><select aria-label={dateLabel(date)} value={days[date] || ''} onChange={e => setDays(d => ({ ...d, [date]: e.target.value }))} className="min-h-11 rounded-md border border-white/25 bg-[#101612] px-2 text-sm focus:outline-[#dbc28a]"><option value="">Not sure</option><option value="yes">Available</option><option value="no">Can’t go</option></select></label>)}</div>
      </section>
      <label className="block font-medium">Anything else? <span className="text-sm font-normal text-[#b7c1b9]">(optional)</span><textarea name="notes" rows={4} maxLength={1000} className={field} aria-describedby="notes-help" /><span id="notes-help" className="mt-2 block text-sm font-normal text-[#b7c1b9]">Scheduling details or ideas for the next outing only. Please don’t include health, financial, location-tracking, or other sensitive information.</span></label>
      <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" name="ageConfirmed" required className="mt-1 h-5 w-5 shrink-0 accent-[#dbc28a]" />I am 13 or older. I understand this is an availability poll, not permission or confirmation to attend.</label>
      <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-[#dbc28a]" />I’ve read the notice above and agree to share these answers with the organizer for planning this activity, including storage and email as described.</label>
    </fieldset>
    {error && <p role="alert" className="rounded-lg border border-amber-300/40 p-4 text-amber-100">{error}</p>}
    <button disabled={busy} className="min-h-13 w-full rounded-lg bg-[#dbc28a] px-6 py-4 font-semibold text-[#101612] disabled:opacity-60">{busy ? 'Saving your response…' : pending.current ? 'Retry the same response' : 'Done — send my availability'}</button>
    <p className="text-center text-xs text-[#b7c1b9]">No account. No email address or phone number required.</p>
  </form>;
}
