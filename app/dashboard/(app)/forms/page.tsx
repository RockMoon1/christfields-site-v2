import { notFound } from 'next/navigation';
import { isFormsOrganizer } from '@/lib/forms/server';
import { getSupabase } from '@/lib/supabase';
import { POLL_SLUG, POLL_DATES, dateLabel } from '@/lib/forms/availability';
import { setPollEnabled } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Private activity responses', robots: { index: false, follow: false } };
type ResponseRow = { id: string; name: string; interest: string; available: string[]; unavailable: string[]; notes: string; created_at: string; email_status: string };
export default async function OrganizerForms() {
  if (!(await isFormsOrganizer())) notFound();
  const sb = getSupabase();
  const [form, result] = await Promise.all([
    sb.from('activity_forms').select('enabled').eq('slug', POLL_SLUG).single(),
    sb.from('activity_responses').select('id,name,interest,available,unavailable,notes,created_at,email_status').eq('form_slug', POLL_SLUG).order('created_at', { ascending: false }).limit(1000),
  ]);
  if (form.error || result.error) return <p role="alert">Forms are temporarily unavailable. No response data could be loaded.</p>;
  const rows = result.data as ResponseRow[];
  const ranked = POLL_DATES.map(date => ({ date, yes: rows.filter(r => r.interest !== 'no' && r.available.includes(date)).length, no: rows.filter(r => r.interest !== 'no' && r.unavailable.includes(date)).length })).sort((a,b) => b.yes-a.yes || a.no-b.no || a.date.localeCompare(b.date));
  return <div className="mx-auto max-w-3xl space-y-7">
    <header><p className="text-sm uppercase tracking-widest text-gold">Organizer only</p><h1 className="mt-2 font-display text-4xl">Iron and Ember forms</h1><p className="mt-3 text-silver">November 2026 car camping. {rows.length} responses{rows.length === 1000 ? ' (showing the latest 1,000)' : ''}. Answers are self-reported; names are not verified.</p></header>
    <section className="rounded-xl border border-white/20 p-5"><h2 className="font-display text-2xl">Sharing &amp; availability</h2><a className="my-3 block break-all text-gold underline" href={`/forms/${POLL_SLUG}`}>https://christfields2717.com/forms/{POLL_SLUG}</a><p className="mb-4 text-sm text-silver">Hub: https://christfields2717.com/forms · Anyone with a link can share it. The poll automatically stops accepting answers after November 30, Mountain time. Closing it keeps existing responses.</p><form action={setPollEnabled}><input type="hidden" name="enabled" value={form.data.enabled ? 'false' : 'true'} /><button className="min-h-12 rounded-lg bg-gold px-5 text-black">{form.data.enabled ? 'Close this poll' : 'Reopen this poll'}</button><span className="ml-4 text-sm">{form.data.enabled ? 'Enabled' : 'Closed'}</span></form></section>
    <section><h2 className="font-display text-3xl">Dates with the most interest</h2><p className="mt-2 text-sm text-silver">“Not sure” is not availability. People who can’t attend are excluded from date counts. Check both days for overnight plans.</p><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{ranked.slice(0, 10).map(d => <p key={d.date} className="rounded border border-white/15 p-3"><strong>{dateLabel(d.date)}</strong><span className="float-right text-sm">{d.yes} available · {d.no} can’t</span></p>)}</div></section>
    <section><h2 className="mb-4 font-display text-3xl">Who answered</h2>{rows.length === 0 && <p className="text-silver">No responses yet. Share the link when you’re ready.</p>}<div className="space-y-4">{rows.map(r => <article key={r.id} className="rounded-xl border border-white/20 p-5"><h3 className="text-lg font-semibold">{r.name} <span className="font-normal text-silver">· {r.interest === 'yes' ? 'Interested' : r.interest === 'maybe' ? 'Maybe' : 'Can’t attend'}</span></h3><p className="mt-2 text-sm text-silver">Available: {r.available.map(dateLabel).join(', ') || 'Not specified'}</p><p className="mt-2 text-sm text-silver">Can’t go: {r.unavailable.map(dateLabel).join(', ') || 'Not specified'}</p>{r.notes && <p className="mt-4 whitespace-pre-wrap break-words">{r.notes}</p>}<p className="mt-4 text-xs text-muted">Received {new Date(r.created_at).toLocaleString('en-US', { timeZone: 'America/Denver' })} Mountain · Email: {r.email_status === 'sent' ? 'Accepted by email provider' : 'Not confirmed sent — response saved here'}</p></article>)}</div></section>
  </div>;
}
