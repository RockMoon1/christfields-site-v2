'use client';
import {usePublishedEvents} from './usePublishedEvents';
import Link from 'next/link';
export default function PublishedEvents({compact=false}:{compact?:boolean}){
 const events=usePublishedEvents();
 if(!events.length)return null;
 return <section aria-label="Published Iron and Ember activities" className={compact?'mt-8 border-t border-white/15 pt-6':'mx-auto my-16 max-w-5xl px-5'}><p className="text-xs uppercase tracking-widest text-gold">Iron and Ember</p><h2 className="mt-2 font-display text-3xl">Make time for what’s next.</h2><p className="mt-3 text-sm text-silver">Explore an activity and share your interest. Plans, eligibility and attendance are confirmed separately by the organizer; this does not replace the community’s joining conversation.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{events.map(e=><article key={e.slug} className="overflow-hidden rounded-xl border border-gold/25 bg-white/[.03]">{e.photo&&<img src={e.photo} alt="Event scenery" className="h-40 w-full object-cover" loading="lazy"/>}<div className="space-y-3 p-5"><h3 className="font-display text-2xl">{e.title}</h3><p className="text-xs text-silver">Planning dates: {e.start} – {e.end}</p><p className="whitespace-pre-wrap text-sm text-silver">{e.summary}</p><Link className="inline-block rounded bg-gold px-4 py-3 text-sm text-black" href={`/forms/${e.slug}`}>View activity &amp; share interest</Link></div></article>)}</div></section>;
}
