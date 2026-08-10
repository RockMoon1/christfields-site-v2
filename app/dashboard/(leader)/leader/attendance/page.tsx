import Link from 'next/link';
import { getAttendanceBoard } from '../actions';
import { AttendanceBoard } from '@/components/leader/AttendanceBoard';

export const metadata = {
  title: 'Attendance | FaithFlow Leader',
};

export default async function AttendancePage() {
  const data = await getAttendanceBoard();

  if (data.state === 'not-leader') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Attendance
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">Choose your small group</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-silver">
          Use the switcher in the top right to pick your small group. Once you are set as a
          leader, you can mark who showed up here.
        </p>
      </div>
    );
  }

  if (data.state === 'no-members') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Attendance
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">{data.org.name}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-silver">
          Invite the people you are walking with, then come back to mark who gathers in person.
        </p>
        <Link
          href="/dashboard/leader/roster"
          className="mt-4 inline-flex items-center gap-2 rounded-sm border border-gold/45 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
        >
          Go to roster
        </Link>
      </div>
    );
  }

  if (data.state === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Attendance
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">{data.org.name}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-silver">
          We could not load attendance just now. Please refresh in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          Attendance
        </p>
        <h1 className="font-display text-4xl font-light text-ivory md:text-5xl">{data.org.name}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-silver">
          Mark who showed up in person. Members can check themselves in; you confirm. This is the
          one thing that unlocks the deeper parts of their walk.
        </p>
      </header>

      <AttendanceBoard initial={data} />
    </div>
  );
}
