'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { POLL_SLUG, dateLabel } from '@/lib/forms/availability';
import {DEFAULT_EVENT,datesFor,localDate,type EventSettings} from '@/lib/forms/events';
import type {EventContext} from '@/lib/forms/context';
const field = 'mt-2 min-h-12 w-full rounded-lg border border-white/25 bg-[#101612] px-3 py-3 text-base text-[#f5f1e7] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#dbc28a]';
export default function AvailabilityForm({slug=POLL_SLUG,settings=DEFAULT_EVENT,context,initialToday}:{slug?:string;settings?:EventSettings;context?:EventContext;initialToday?:string}={}) {
 const [today,setToday]=useState(initialToday||localDate(settings.tz));
 useEffect(()=>{const tick=()=>setToday(localDate(settings.tz));tick();const timer=setInterval(tick,30000);return()=>clearInterval(timer);},[settings.tz]);
 const dates=datesFor(settings,today);
 const months=[...new Set(dates.map(d=>d.slice(0,7)))];
 const [month,setMonth]=useState('');
 const selectedMonth=months.includes(month)?month:months[0];
 const visibleDates=dates.filter(d=>d.startsWith(selectedMonth||''));
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
    pending.current ??= { formSlug:slug,email:data.get('email')||'',phone:data.get('phone')||'',followUp:data.get('followUp')==='on',receiptRequested:data.get('receiptRequested')==='on',priorAttendance:data.get('priorAttendance')||'unspecified', submissionId: id.current, name: data.get('name'), interest: data.get('interest'), notes: data.get('notes'), website: data.get('website'), consent: data.get('consent') === 'on', ageConfirmed: data.get('ageConfirmed') === 'on', available: dates.filter(d => days[d] === 'yes'), unavailable: dates.filter(d => days[d] === 'no') };
    try {
      const response = await fetch('/api/forms/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending.current) });
      const result = await response.json();
      if (response.ok && result.ok) { setDone(true); return; }
      if ([400, 413, 415].includes(response.status)) pending.current = null;
      setError(result.error || 'Could not confirm your response. Retry to send the same answers.');
    } catch { setError('Connection interrupted. Your answers are still here. Retry to send the same answers without duplicating your response.'); }
    finally { locked.current = false; setBusy(false); }
  }
  if (done) return <section role="status" className="my-8 rounded-xl border border-[#dbc28a]/40 bg-[#1b251e] p-8"><h2 className="font-display text-4xl">You're on the planning list.</h2><p className="mt-4 leading-relaxed">Your response is saved for the organizer. This does not confirm a trip or ticket. Look for the final plan in the group.</p><p className="my-4 break-all text-sm">Receipt reference: {id.current}</p><button className="rounded border px-4 py-3" onClick={()=>{const a=document.createElement('a');const url=URL.createObjectURL(new Blob([`Christ Fields receipt\nEvent: ${settings.title}\nReference: ${id.current}\nSaved successfully. Not an attendance or ticket confirmation.\n\n${JSON.stringify(pending.current,null,2)}`],{type:'text/plain'}));a.href=url;a.download='christ-fields-receipt.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Download my receipt</button>{settings.receipts&&<p className="mt-4 text-sm">If you requested email, a verification notice may arrive shortly. Sending is limited to prevent abuse; delivery is not guaranteed. This download remains your receipt.</p>}{settings.moreInfo&&<aside className="mt-5 space-y-4 border-t pt-5"><h3 className="font-display text-2xl">Planning information</h3><p className="whitespace-pre-wrap">{settings.clothing}</p><blockquote className="whitespace-pre-wrap">{settings.scripture}</blockquote><p className="whitespace-pre-wrap">{settings.information}</p><p>{context?.weatherStatus||'Weather details will follow once a location is set.'}</p></aside>}<p className="mt-3 text-sm text-[#c3ccc5]">Need to correct or delete your response? Email proverbs@christfields2717.com with your name and this poll's title.</p></section>;
  return <form onSubmit={submit} className="mt-8 space-y-7">
    <aside aria-label="Privacy and cookies" className="rounded-xl border border-white/20 bg-[#1b251e] p-5 text-sm leading-relaxed text-[#c3ccc5]">
      <h2 className="mb-2 font-semibold text-[#f5f1e7]">Before you share</h2>
      <p>Christ Fields collects the name you provide, attendance interest, date choices, and optional scheduling notes to plan this Iron and Ember activity. Responses are stored in Supabase for the organizer's private dashboard and may be sent through Resend to proverbs@christfields2717.com. Other visitors cannot see them. Participation is optional.</p>
      <p className="mt-3">Contact details are stored privately for this event's planning. Optional consent below permits future activity follow-up. Prior attendance is an optional self-report, not identity verification. Email receipts use Resend to send a verification link valid for 24 hours. Contact details are not included in organizer notification emails. Holiday and weather providers receive event dates and venue coordinates only, not your answers.</p>
      <p className="mt-3">This form adds no advertising or analytics cookies. Hosting providers process technical request information, including IP addresses, for delivery and security; we use a daily hashed IP identifier for abuse limits. The signed-in dashboard uses necessary sign-in cookies. See the <a href="/privacy" className="underline">privacy policy</a> and contact the organizer for access, corrections, or deletion. Closing a poll does not automatically delete its stored responses or email copies.</p>
      <p className="mt-3">This site is for ages 13 and older. Under 13? Do not enter personal information here; ask a parent or guardian to contact the organizer. If you're under 18, involve a parent or guardian in trip planning. Submitting this poll is not parental permission to attend.</p>
    </aside>
    <fieldset disabled={busy || !!pending.current} className="space-y-7 disabled:opacity-70">
      <legend className="sr-only">Your availability</legend>
      <label className="block font-medium">Your name <span className="text-sm font-normal text-[#b7c1b9]">(first name and last initial is fine)</span><input name="name" required maxLength={80} autoComplete="name" className={field} /></label>
      <label className="block font-medium">Interested in coming?<select name="interest" required className={field} defaultValue=""><option value="" disabled>Choose one</option><option value="yes">Yes, I'd like to go</option><option value="maybe">Maybe - depends on the plan</option><option value="no">I can't make it this time</option></select></label>
      {(['email','phone'] as const).map(key=>settings[key]!=='off'&&<label key={key} className="block">{key==='email'?'Email address':'Phone number'} ({settings[key]})<input name={key} type={key==='email'?'email':'tel'} autoComplete={key==='email'?'email':'tel'} maxLength={key==='email'?254:32} required={settings[key]==='required'} className={field}/></label>)}
      <label className="block">Have you attended an Iron and Ember activity before? (optional)<select name="priorAttendance" className={field} defaultValue="unspecified"><option value="unspecified">Prefer not to say</option><option value="first">This would be my first</option><option value="returning">Yes, I've attended before</option></select></label>
      <section aria-labelledby="days-heading"><h2 id="days-heading" className="font-display text-3xl">Which days work?</h2><p className="mt-2 text-sm text-[#b7c1b9]">Event timezone: {settings.tz}. Today: {today}. Past dates cannot be selected. Leave days as "Not sure" if you don't know; we won't count those as available.</p>
        <div className="mt-4 flex gap-2" aria-label="Choose month">{months.map(m=><button type="button" key={m} aria-pressed={m===selectedMonth} onClick={()=>setMonth(m)} className="rounded border border-gold/40 px-4 py-3 aria-pressed:bg-gold aria-pressed:text-black">{new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m+'-01T12:00:00Z'))}</button>)}</div><aside className="mt-4 rounded-xl bg-white/5 p-4 text-sm"><p className="text-xs uppercase tracking-wider text-gold">{settings.weather?'Local forecast · about seven days':'Location to come'}</p><p className="mt-2 text-silver">{context?.weatherStatus||'Local weather details will appear when the location is set.'}</p></aside><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{visibleDates.map(date => <label key={date} className="flex items-center justify-between gap-3 rounded-lg border border-white/15 p-3"><span className="text-sm">{dateLabel(date)}{context?.days[date]?.observances.map((o,i)=><span key={i} className="mt-1 block text-xs text-gold">{o.label}</span>)}{settings.weather&&<span className="mt-2 block text-xs text-silver">{context?.days[date]?.weather||"Check back closer to the date for a local forecast."}</span>}</span><select aria-label={dateLabel(date)} value={days[date] || ''} onChange={e => setDays(d => ({ ...d, [date]: e.target.value }))} className="min-h-11 rounded-md border border-white/25 bg-[#101612] px-2 text-sm focus:outline-[#dbc28a]"><option value="">Not sure</option><option value="yes">Available</option><option value="no">Can't go</option></select></label>)}</div>
      {context&&<aside className="mt-4 space-y-2 text-xs text-silver"><p>Selected US federal and Western Christian/Catholic dates; practices vary. Federal coverage: 2026–2027; selected Catholic dates: 2026. Sources: <a href="https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/">OPM</a>, <a href="https://www.usccb.org/resources/2026cal.pdf">USCCB</a>.</p><p>{context.jewishStatus} Data: <a href="https://www.hebcal.com">Hebcal</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> (labels adapted).</p><p>{context.weatherStatus} {context.updated}</p></aside>}
      </section>
      <label className="block font-medium">Anything else? <span className="text-sm font-normal text-[#b7c1b9]">(optional)</span><textarea name="notes" rows={4} maxLength={1000} className={field} aria-describedby="notes-help" /><span id="notes-help" className="mt-2 block text-sm font-normal text-[#b7c1b9]">Scheduling details or ideas for the next outing only. Please don't include health, financial, location-tracking, or other sensitive information.</span></label>
      <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" name="ageConfirmed" required className="mt-1 h-5 w-5 shrink-0 accent-[#dbc28a]" />I am 13 or older. I understand this is an availability poll, not permission or confirmation to attend.</label>
      <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-[#dbc28a]" />I've read the notice above and agree to share these answers with the organizer for planning this activity, including storage and email as described.</label>
      {(settings.email!=='off'||settings.phone!=='off')&&<label className="flex gap-3 text-sm"><input type="checkbox" name="followUp"/>Optional: the organizer may use my contact details for future Iron and Ember activities. I can withdraw permission by contacting proverbs@christfields2717.com.</label>}
      {settings.receipts&&<label className="flex gap-3 text-sm"><input type="checkbox" name="receiptRequested"/>Send a receipt verification link to my email. I control the address provided. This does not subscribe me to updates.</label>}
    </fieldset>
    {error && <p role="alert" className="rounded-lg border border-amber-300/40 p-4 text-amber-100">{error}</p>}
    <button disabled={busy||!dates.length} className="min-h-13 w-full rounded-lg bg-[#dbc28a] px-6 py-4 font-semibold text-[#101612] disabled:opacity-60">{busy ? 'Saving your response…' : pending.current ? 'Retry the same response' : 'Done — send my availability'}</button>
    <p className="text-center text-xs text-[#b7c1b9]">No account needed. This public link can be shared.</p>
  </form>;
}
