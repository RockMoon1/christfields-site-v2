import Link from 'next/link';
import {getSupabase} from '@/lib/supabase';
import {parseSettings} from '@/lib/forms/events';
import {formOpen} from '@/lib/forms/server';
export const dynamic='force-dynamic';
export default async function FormsHub(){
 const {data,error}=await getSupabase().from('activity_forms').select('slug,enabled,settings,photo_version').order('updated_at',{ascending:false}).limit(100);
 return <><p className="mb-3 mt-12 text-sm uppercase tracking-widest text-gold">Make room for time together</p><h1 className="font-display text-5xl">Good plans start here.</h1><p className="mt-5 text-lg text-silver">A little planning. More time together. Choose an activity below. No account needed.</p><div className="my-10 grid gap-4 sm:grid-cols-2">{(data||[]).map(f=>{const s=parseSettings(f.settings);if(!s||!formOpen({...f,settings:s}))return null;return <article key={f.slug} className="rounded-xl border border-gold/30 bg-[#1b251e] p-6"><p className="text-xs uppercase text-gold">{s.status}</p><h2 className="mt-3 font-display text-3xl">{s.title}</h2><p className="mt-3 line-clamp-3 text-silver">{s.summary}</p><Link className="mt-5 inline-block rounded-lg bg-gold px-5 py-3 text-black" href={`/forms/${f.slug}`}>Share my availability</Link></article>;})}</div>{error&&<p>Forms are temporarily unavailable. Please try again later.</p>}<blockquote className="border-l-2 border-gold pl-5 font-display text-2xl">“Iron sharpens iron, and one man sharpens another.”<cite className="mt-2 block font-sans text-sm not-italic text-silver">Proverbs 27:17</cite></blockquote><p className="mt-8 text-sm text-silver">Anyone with a link can share it. Closed forms keep their responses private.</p></>;
}
