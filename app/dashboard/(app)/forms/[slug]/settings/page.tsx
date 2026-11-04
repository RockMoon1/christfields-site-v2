import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getOrganizerForm} from '@/lib/forms/server';
import EventEditor from '@/components/forms/EventEditor';
export const dynamic='force-dynamic';
export const metadata={title:'Private event settings',robots:{index:false,follow:false}};
export default async function Settings({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const form=await getOrganizerForm(slug);if(!form)notFound();
 return <div className="mx-auto max-w-2xl space-y-6"><Link href="/dashboard/forms" className="text-gold underline">← Back to event cards</Link><header><p className="text-sm uppercase text-gold">Organizer only</p><h1 className="mt-2 font-display text-4xl">{form.settings.title}: settings</h1><p className="mt-3 text-silver">Manage the link, publication, contacts, receipts, photos and weather here.</p></header><EventEditor form={form}/></div>;
}
