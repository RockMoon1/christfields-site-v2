import { redirect } from 'next/navigation';

/** Old bookmarks and installed apps still open /dashboard/today. Home is /dashboard now. */
export default function TodayRedirect() {
  redirect('/dashboard');
}
