import Link from 'next/link';
import { pollIsOpen } from '@/lib/forms/server';
import { POLL_SLUG } from '@/lib/forms/availability';
export const dynamic = 'force-dynamic';
export default async function FormsHub() {
  const open = await pollIsOpen();
  return <>
    <p className="mb-3 mt-12 text-sm uppercase tracking-[.2em] text-[#dbc28a]">Make room for time together</p>
    <h1 className="font-display text-5xl sm:text-6xl">Good plans start here.</h1>
    <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#c3ccc5]">A little planning. More time outside, around a fire, and in good company. Pick a form below. No account needed.</p>
    <section aria-label="Available forms" className="my-10 rounded-2xl border border-[#dbc28a]/30 bg-[#1b251e] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-widest text-[#dbc28a]">November 2026 · Availability poll</p>
      <h2 className="mt-3 font-display text-3xl">Car camping &amp; mountain towns</h2>
      <p className="mt-3 leading-relaxed text-[#c3ccc5]">Winter is almost here, and ski season is starting. Tell us which November days could work for you.</p>
      <Link href={`/forms/${POLL_SLUG}`} className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-[#dbc28a] px-6 font-medium text-[#101612]">{open ? 'Share my availability' : 'View poll status'} <span aria-hidden="true" className="ml-4">→</span></Link>
    </section>
    <blockquote className="border-l-2 border-[#dbc28a] pl-5 font-display text-2xl">“Iron sharpens iron, and one man sharpens another.”<cite className="mt-2 block font-sans text-sm not-italic text-[#b7c1b9]">Proverbs 27:17</cite></blockquote>
    <p className="mt-10 text-sm text-[#b7c1b9]">More gathering ideas and forms will be added here as they’re ready.</p>
  </>;
}
