import { useEffect, useState, type ReactNode } from 'react';
import YouPage from '@/app/dashboard/(app)/settings/page';
import AvailabilityPage from '@/app/dashboard/(app)/availability/page';
import CommunityPage from '@/app/dashboard/(app)/community/page';
import EventPage from '@/app/dashboard/(app)/e/[id]/page';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileTabBar } from '@/components/dashboard/MobileTabBar';

/** Actual page JSX with synthetic data/actions; no RSC transport or authentication. */
export function DashboardPageFixture({ which, shell }: { which: 'settings' | 'availability' | 'community-page' | 'event-page'; shell: boolean }) {
  const [content, setContent] = useState<ReactNode>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('fixture-route-refresh', refresh);
    return () => window.removeEventListener('fixture-route-refresh', refresh);
  }, []);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(window.location.search);
    const google = query.get('notice') ?? undefined;
    const rendered = which === 'event-page'
      ? EventPage({ params: Promise.resolve({ id: 'fixture-event' }) })
      : which === 'community-page'
      ? CommunityPage()
      : (which === 'settings' ? YouPage : AvailabilityPage)({ searchParams: Promise.resolve({ google }) });
    void rendered.then((page) => {
      if (active) setContent(page);
    }).catch((error: unknown) => {
      if (active) setContent(<p role="alert">Fixture page could not render: {error instanceof Error ? error.message : 'unknown error'}</p>);
    });
    return () => { active = false; };
  }, [which, revision]);
  const family = <div data-testid="dashboard-family" data-fixture-kind="actual-page-jsx-with-synthetic-services">{content ?? <p>Loading synthetic page…</p>}</div>;
  if (!shell) return <main className="fixture-main" data-testid="fixture-content">{family}</main>;
  return <div data-testid="dashboard-route-shell" className="min-h-screen bg-black-2 text-ivory">
    <Sidebar />
    <div className="lg:pl-60">
      <TopBar />
      <main id="main" className="px-4 py-6 pb-28 sm:px-6 md:p-10 lg:pb-10" data-testid="fixture-content">{family}</main>
    </div>
    <MobileTabBar />
  </div>;
}
