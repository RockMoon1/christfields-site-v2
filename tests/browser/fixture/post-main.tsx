import { useEffect, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { PostForm } from '@/components/lead/PostForm';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { MobileTabBar } from '@/components/dashboard/MobileTabBar';
import { postActionSnapshot, readPostFixture, settlePostAction } from './post-actions';
import '../../../app/globals.css';
import './fixture.css';

function subscribe(update: () => void) {
  window.addEventListener('post-fixture-actions-changed', update);
  return () => window.removeEventListener('post-fixture-actions-changed', update);
}

function FixtureControls() {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(postActionSnapshot()));
  useEffect(() => {
    const settle = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: number; success: boolean; name?: 'createEvent' | 'updateEvent' | 'getOrgAvailability' }>).detail;
      settlePostAction(detail.success, detail.name, detail.id);
    };
    window.addEventListener('fixture-post-settle', settle);
    return () => window.removeEventListener('fixture-post-settle', settle);
  }, []);
  const state = JSON.parse(snapshot) as ReturnType<typeof postActionSnapshot>;
  return <aside className="fixture-controls" aria-label="Synthetic post action controls">
    <button type="button" onClick={() => settlePostAction(true)}>Resolve next post request</button>
    <button type="button" onClick={() => settlePostAction(false)}>Reject next post request</button>
    <p className="w-full text-sm">{state.pending.length} pending synthetic requests · {state.refreshes} refresh requests</p>
    <output hidden data-testid="post-action-state">{snapshot}</output>
    <output data-testid="post-navigation-state">{state.navigations.map(item => `${item.method}: ${item.destination}`).join('\n')}</output>
  </aside>;
}

const fixture = readPostFixture();
function PostFamily() {
  return <div className="mx-auto max-w-2xl">
    <p className="mb-2 text-meta font-medium uppercase tracking-[0.2em] text-gold">Synthetic leader workspace</p>
    <h1 className="mb-3 font-display text-3xl leading-tight text-ivory">{fixture.mode === 'create' ? 'Make room for a gathering.' : 'Change the gathering.'}</h1>
    <button type="button" data-testid="outside-post-control" className="mb-5 min-h-[44px] rounded-sm border border-border-sub px-3 text-sm text-silver">Outside the posting form</button>
    <div data-testid="post-family" data-fixture-kind="actual-post-form-with-synthetic-services"><PostForm {...fixture} /></div>
  </div>;
}

function App() {
  const shell = new URLSearchParams(window.location.search).get('shell') === '1';
  return <MotionConfig reducedMotion="user">
    <div className="fixture-banner">Browser fixture · synthetic leader data · no real events, accounts, or notifications</div>
    <FixtureControls />
    <p className="fixture-exclusions">Actual PostForm and WhoIsFree components, with an optional dashboard shell. Authentication, server rendering and real services are excluded. Navigation is recorded only; this fixture does not verify Next.js routing. Scripture fields contain synthetic leader text.</p>
    {shell ? <div data-testid="dashboard-route-shell" className="min-h-screen bg-black-2 text-ivory">
      <Sidebar />
      <div className="lg:pl-60"><TopBar /><main id="main" className="px-4 py-6 pb-28 sm:px-6 md:p-10 lg:pb-10" data-testid="fixture-content"><PostFamily /></main></div>
      <MobileTabBar />
    </div> : <main className="fixture-main" data-testid="fixture-content"><PostFamily /></main>}
  </MotionConfig>;
}

createRoot(document.getElementById('root')!).render(<App />);
