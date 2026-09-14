import { useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { Button } from '@/components/Button';
import { Surface } from '@/components/ui/Surface';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { DashContainer } from '@/components/ui/DashContainer';
import { ConfirmAction } from '@/components/dashboard/ConfirmAction';
import { CommunityWall } from '@/components/dashboard/CommunityWall';
import { EventCard } from '@/components/dashboard/EventCard';
import { TopBar } from '@/components/dashboard/TopBar';
import RouteSkeleton from '@/components/dashboard/RouteSkeleton';
import { actionSnapshot, runFixtureAction, settlePending } from './actions';
import { DashboardPageFixture } from './dashboard-pages';
import type { FeedEvent } from '@/app/dashboard/(app)/events/actions';
import '../../../app/globals.css';
import './fixture.css';

const event: FeedEvent = {
  id: 'fixture-event', orgId: 'fixture-group', orgName: 'Fixture group', title: 'Synthetic gathering', type: 'gathering',
  startsAt: '2026-09-11T18:00:00Z', endsAt: null, tz: 'America/Denver', location: '',
  description: 'Illustrative fixture data.', memberNote: '', status: 'scheduled', cancelReason: '', cancelledAt: null,
  version: 1, seriesId: null, ridesEnabled: false, scriptureRef: '', scriptureText: '', scriptureWhy: '', discussion: '',
  myStatus: 'maybe', faces: [{ displayName: 'Alex', imageUrl: '', status: 'going' }], going: 1, maybe: 1,
};
const prayers = [
  { id: 'fixture-other', author_name: 'Alex', title: 'Synthetic request from Alex', body: 'A fixture request for testing.',
    pray_count: 0, answered: false, created_at: '2026-09-07T18:00:00Z', prayedByMe: false, mine: false },
  { id: 'fixture-mine', author_name: 'You', title: 'Synthetic request of mine', body: '',
    pray_count: 0, answered: false, created_at: '2026-09-07T18:00:00Z', prayedByMe: false, mine: true },
];

function subscribeToActions(update: () => void) {
  window.addEventListener('fixture-actions-changed', update);
  return () => window.removeEventListener('fixture-actions-changed', update);
}

function FixtureControls() {
  // Action instrumentation is an external store. A useState observer inherits
  // the component's async transition and can show an old count until settlement.
  const snapshot = useSyncExternalStore(subscribeToActions, () => JSON.stringify(actionSnapshot()));
  return <aside className="fixture-controls" aria-label="Fixture action controls">
    <button type="button" onClick={() => settlePending(true)}>Resolve pending action</button>
    <button type="button" onClick={() => settlePending(false)}>Reject pending action</button>
    <output data-testid="action-state">{snapshot}</output>
  </aside>;
}

function Foundations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'problem' | 'saved'>('problem');
  const [name, setName] = useState('');
  async function save() {
    setPending(true); setNotice(null);
    try { await runFixtureAction('save'); setNoticeTone('saved'); setNotice('Fixture saved.'); }
    catch { setNoticeTone('problem'); setNotice('Fixture save failed. Your words are still here.'); }
    finally { setPending(false); }
  }
  return <DashContainer><PageHeader title="Foundation controls" eyebrow="Fixture" />
    <Surface interactive><div className="space-y-4">
      <Field id="fixture-name" label="Fixture name" hint="Synthetic input only." error={error}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field id="fixture-notes" label="Fixture notes"><Textarea /></Field>
      <div className="flex flex-wrap gap-3">
        <Button fx={false} onClick={save} pending={pending} pendingLabel="Saving fixture…">Save fixture</Button>
        <Button fx={false} variant="quiet" disabled>Disabled fixture</Button>
        <Button fx={false} variant="quiet" onClick={() => setError('Enter a fixture name.')}>Show field error</Button>
      </div>
      <Notice message={notice} tone={noticeTone} />
    </div></Surface>
  </DashContainer>;
}

function Deletion() {
  const [deleted, setDeleted] = useState(false);
  return <Surface>
    <h1 className="mb-4 text-xl">Synthetic reflection</h1>
    {deleted ? <p role="status">Fixture reflection deleted.</p> : <ConfirmAction label="Delete fixture reflection" onConfirm={async () => {
      await runFixtureAction('delete'); setDeleted(true);
    }}>Delete reflection</ConfirmAction>}
  </Surface>;
}

function LinkStates() {
  const [pending, setPending] = useState(false);
  const [activations, setActivations] = useState(0);
  async function startWork() {
    setPending(true);
    try { await runFixtureAction('link'); }
    catch { /* A synthetic rejection releases this presentation-only pending state. */ }
    finally { setPending(false); }
  }
  return <Surface>
    <h1 className="mb-4 text-xl">Synthetic link states</h1>
    <div className="flex flex-wrap gap-3">
      <Button fx={false} href="#fixture-disabled" disabled onClick={() => setActivations((value) => value + 1)}>Disabled link</Button>
      <Button fx={false} href="#fixture-active" pending={pending} pendingLabel="Opening fixture…" onClick={() => setActivations((value) => value + 1)}>Fixture destination</Button>
      <Button fx={false} variant="quiet" onClick={startWork} disabled={pending}>Start link work</Button>
    </div>
    <output data-testid="link-activations">{activations}</output>
  </Surface>;
}

function LinkFocus() {
  const [pending, setPending] = useState(false);
  const [focused, setFocused] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  async function activate() {
    setPending(true);
    try { await runFixtureAction('focused-link'); }
    catch { /* Release the same anchor for a synthetic retry. */ }
    finally { setPending(false); }
  }
  return <Surface>
    <h1 className="mb-4 text-xl">Synthetic keyboard link</h1>
    <Button fx={false} href="/fixture-destination" ref={linkRef} id="focus-link"
      data-fixture="forwarded" title="Link attribute fixture" aria-describedby="focus-link-hint"
      pending={pending} pendingLabel="Opening fixture…" onFocus={() => setFocused(true)}
      onClick={(event) => { event.preventDefault(); void activate(); }}>Open fixture</Button>
    <p id="focus-link-hint">This destination is synthetic.</p>
    <output data-testid="link-ref">{focused && linkRef.current?.id}</output>
  </Surface>;
}

function Notices() {
  const [shown, setShown] = useState(false);
  return <Surface>
    <h1 className="mb-4 text-xl">Synthetic notices</h1>
    <Button fx={false} onClick={() => setShown(!shown)}>Toggle messages</Button>
    <div className="mt-4 space-y-4">
      <section aria-label="Problem notice"><Notice message={shown ? 'Fixture request failed. Try again.' : null} /></section>
      <section aria-label="Saved notice"><Notice tone="saved" message={shown ? 'Fixture saved.' : null} /></section>
      <section aria-label="Information notice"><Notice tone="info" message={shown ? 'Fixture information.' : null} /></section>
    </div>
  </Surface>;
}

function App() {
  const query = new URLSearchParams(window.location.search);
  const which = query.get('case') ?? 'foundations';
  const dashboardPage = which === 'settings' || which === 'availability' || which === 'community-page';
  return <MotionConfig reducedMotion="user">
    <div className="fixture-banner">Browser fixture · synthetic data · no real accounts, prayers, notifications, or contacts</div>
    <FixtureControls />
    {dashboardPage ? <>
      <p className="fixture-exclusions">Actual page JSX with synthetic actions and data. PushSettingsCard, TimeZoneSync, PushSync, Clerk account interactions, authentication and server rendering are excluded.{which !== 'community-page' && ' Install instructions are shown, but no installation prompt is supplied.'}</p>
      <DashboardPageFixture which={which} shell={query.get('shell') === '1'} />
    </> :
    <main className="fixture-main" data-testid="fixture-content">
      {which === 'foundations' && <Foundations />}
      {which === 'community' && <CommunityWall initial={prayers} totalPrayed={0} />}
      {which === 'event' && <EventCard event={event} whenText="Friday evening" googleUrl="#fixture-calendar" />}
      {which === 'delete' && <Deletion />}
      {which === 'links' && <LinkStates />}
      {which === 'link-focus' && <LinkFocus />}
      {which === 'notices' && <Notices />}
      {which === 'header' && <div data-testid="safe-area-shell"><TopBar /><h1 className="p-4 text-xl">Fixture page heading</h1></div>}
      {which === 'skeleton' && <RouteSkeleton />}
    </main>}
  </MotionConfig>;
}

createRoot(document.getElementById('root')!).render(<App />);
