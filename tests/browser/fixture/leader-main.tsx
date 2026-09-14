import { useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
// Relative import intentionally bypasses the member fixture's excluded-leader alias.
import { LeaderStrip } from '../../../components/lead/LeaderStrip';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileTabBar } from '@/components/dashboard/MobileTabBar';
import { leaderActionSnapshot, readLeaderView, recordLeaderRefresh, settleLeaderAction } from './leader-actions';
import '../../../app/globals.css';
import './fixture.css';

function subscribe(update: () => void) {
  window.addEventListener('leader-fixture-actions-changed', update);
  return () => window.removeEventListener('leader-fixture-actions-changed', update);
}

function FixtureControls() {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(leaderActionSnapshot()));
  const persistedView = useSyncExternalStore(subscribe, () => JSON.stringify(readLeaderView()));
  return <aside className="fixture-controls" aria-label="Synthetic leader action controls">
    <button type="button" onClick={() => settleLeaderAction(true)}>Resolve pending leader action</button>
    <button type="button" onClick={() => settleLeaderAction(false)}>Reject pending leader action</button>
    <output data-testid="leader-action-state">{snapshot}</output>
    <output hidden data-testid="leader-view-state">{persistedView}</output>
  </aside>;
}

function LeaderFamily() {
  const [view, setView] = useState(readLeaderView);
  useEffect(() => {
    const refresh = () => setView(recordLeaderRefresh());
    window.addEventListener('fixture-route-refresh', refresh);
    return () => window.removeEventListener('fixture-route-refresh', refresh);
  }, []);
  const whenText = new Date(view.event.startsAt).getTime() <= Date.now() ? 'Earlier today, 10 am' : 'Today, 2 pm';
  return <div className="mx-auto max-w-2xl">
    <h1 className="font-display text-3xl leading-tight text-ivory">A table for the whole group</h1>
    <button type="button" data-testid="outside-leader-control" className="mb-5 mt-3 min-h-[44px] rounded-sm border border-border-sub px-3 text-sm text-silver">Outside leader tools</button>
    <div data-testid="leader-family" data-fixture-kind="actual-leader-component-with-synthetic-services">
      <LeaderStrip view={view} whenText={whenText} />
    </div>
  </div>;
}

function App() {
  const shell = new URLSearchParams(window.location.search).get('shell') === '1';
  return <MotionConfig reducedMotion="user">
    <div className="fixture-banner">Browser fixture · synthetic leader data · no real accounts, messages, attendance, or notifications</div>
    <FixtureControls />
    <p className="fixture-exclusions">Actual LeaderStrip and optional dashboard shell. Authentication, server rendering, real services, calendar tokens and notification delivery are excluded. Refresh rereads synthetic data only.</p>
    {shell ? <div data-testid="dashboard-route-shell" className="min-h-screen bg-black-2 text-ivory">
      <Sidebar />
      <div className="lg:pl-60">
        <TopBar />
        <main id="main" className="px-4 py-6 pb-28 sm:px-6 md:p-10 lg:pb-10" data-testid="fixture-content"><LeaderFamily /></main>
      </div>
      <MobileTabBar />
    </div> : <main className="fixture-main" data-testid="fixture-content"><LeaderFamily /></main>}
  </MotionConfig>;
}

createRoot(document.getElementById('root')!).render(<App />);
