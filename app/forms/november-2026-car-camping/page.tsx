import EventPage from '@/components/forms/EventPage';
import {POLL_SLUG} from '@/lib/forms/availability';
export const dynamic='force-dynamic';
export default function CampingPoll(){return <EventPage slug={POLL_SLUG}/>;}
