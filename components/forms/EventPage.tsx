import {notFound} from 'next/navigation';
import {getPublicForm,formOpen} from '@/lib/forms/server';
import {datesFor,localDate} from '@/lib/forms/events';
import {eventContext} from '@/lib/forms/context';
import AvailabilityForm from './AvailabilityForm';
export default async function EventPage({slug}:{slug:string}){
 const form=await getPublicForm(slug);if(!form)notFound();const s=form.settings;
 const today=localDate(s.tz),open=formOpen(form),context=open?await eventContext(s,datesFor(s,today)):undefined;
 return <><p className="mt-8 text-sm uppercase tracking-widest text-gold">Iron and Ember / {s.status}</p><h1 className="mt-3 font-display text-5xl">{s.title}</h1>{form.photo_version&&<img src={`/api/forms/photo/${slug}?v=${form.photo_version}`} alt="Event scenery" className="mt-6 max-h-80 w-full rounded-xl object-cover"/>}<p className="mt-5 whitespace-pre-wrap text-lg text-silver">{s.summary}</p><p className="mt-4 text-sm text-silver">This is a planning poll, not a booking or confirmed trip. Tickets, discounts, costs, location and final arrangements will be confirmed separately. For overnight plans, mark both days.</p>{open?<AvailabilityForm slug={slug} settings={s} context={context} initialToday={today}/>:<section className="my-8 rounded-xl border border-white/20 p-6"><h2 className="font-display text-3xl">This poll isn't accepting responses.</h2><p className="mt-3">Contact proverbs@christfields2717.com for updates.</p></section>}</>;
}
