import EventPage from '@/components/forms/EventPage';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{slug:string}>}){return <EventPage slug={(await params).slug}/>;}
