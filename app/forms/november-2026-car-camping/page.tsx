import { pollIsOpen } from '@/lib/forms/server';
import AvailabilityForm from '@/components/forms/AvailabilityForm';
export const dynamic = 'force-dynamic';
export default async function CampingPoll() {
  const open = await pollIsOpen();
  return <>
    <p className="mt-8 text-sm uppercase tracking-widest text-[#dbc28a]">November 2026 · Colorado</p>
    <h1 className="mt-3 font-display text-5xl">Let’s get outside.</h1>
    <p className="mt-5 text-lg leading-relaxed text-[#c3ccc5]">Winter is almost here, and ski season is starting! We’re finding dates for car camping, walking through mountain towns, and time together. Tell us what works for you.</p>
    <p className="mt-4 text-sm leading-relaxed text-[#b7c1b9]">This is a planning poll, not a booking or a confirmed trip. Any ski-pass discounts, tickets, costs, location, and arrangements will be confirmed separately. For an overnight trip, mark both days if you can attend both.</p>
    {open ? <AvailabilityForm /> : <section className="my-8 rounded-xl border border-white/20 p-6"><h2 className="font-display text-3xl">This poll isn’t accepting responses.</h2><p className="mt-3">It may be closed or temporarily unavailable. Please contact <a className="underline" href="mailto:proverbs@christfields2717.com">proverbs@christfields2717.com</a>.</p></section>}
  </>;
}
