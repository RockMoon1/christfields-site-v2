import { redirect } from 'next/navigation';
import { isLeaderAnywhere } from '@/lib/groups/membership';

/** Leader pages live inside the member shell. Non-leaders go home. */
export default async function LeadLayout({ children }: { children: React.ReactNode }) {
  if (!(await isLeaderAnywhere())) redirect('/dashboard');
  return <>{children}</>;
}
