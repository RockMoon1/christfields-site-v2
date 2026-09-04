'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

/**
 * Phone alerts, in three pieces:
 *  - usePush(): the browser state machine (unsupported / needs install /
 *    blocked / off / on) and the two actions.
 *  - PushPrimerCard: Home's one-time ask, after a first "I'm in". The ask is
 *    per MEMBER, so it is only spent on a real outcome (turned on, or "Not
 *    now"), never because this particular device cannot do push.
 *  - PushSettingsCard: the switch on You.
 *  - PushSync: invisible; re-sends the subscription only when the endpoint or
 *    the signed-in member changed (Safari does not reliably fire
 *    pushsubscriptionchange). Liveness itself comes from device acks.
 *
 * The permission prompt only ever runs inside a tap, which iOS requires.
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const LS_KEY = 'cf_push_synced';

export type PushState = 'loading' | 'unsupported' | 'unconfigured' | 'needs_install' | 'blocked' | 'off' | 'on';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return '';
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function supported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

async function postSubscription(sub: PushSubscription): Promise<boolean> {
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), userAgent: navigator.userAgent.slice(0, 200) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function remember(endpoint: string, userId: string) {
  try {
    localStorage.setItem(LS_KEY, `${endpoint}|${userId}`);
  } catch {
    // storage blocked; harmless
  }
}

export function usePush() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!supported()) {
      setState(isIOS() && !isStandalone() ? 'needs_install' : 'unsupported');
      return;
    }
    if (!VAPID_PUBLIC) {
      setState('unconfigured');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('blocked');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
    } catch {
      setState('off');
    }
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  const enable = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return false;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      // A subscription made under an older key cannot receive our pushes: replace it.
      if (sub && bufToBase64Url(sub.options.applicationServerKey) !== VAPID_PUBLIC.replace(/=+$/, '')) {
        await sub.unsubscribe().catch(() => undefined);
        sub = null;
      }
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource,
        });
      }
      const ok = await postSubscription(sub);
      if (!ok) {
        setError('Could not save it. Try once more.');
        return false;
      }
      remember(sub.endpoint, userId);
      setState('on');
      return true;
    } catch (err) {
      console.error('push enable failed', err);
      setError('Your browser said no. You can still get emails.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [userId]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined);
        await sub.unsubscribe();
      }
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
      setState('off');
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, error, enable, disable };
}

/* ------------------------------------------------------------ Home primer */

export function PushPrimerCard({ onDone, onDismiss }: { onDone: () => void; onDismiss: () => void }) {
  const { state, busy, error, enable } = usePush();

  useEffect(() => {
    // Already on for this member on this device: the ask is answered.
    if (state === 'on') onDone();
  }, [state, onDone]);

  // Nothing this device can do about it: show nothing, but keep the ask for a device that can.
  if (state !== 'off' && state !== 'needs_install') return null;

  if (state === 'needs_install') {
    return (
      <section className="mb-6 rounded-sm border border-border-gold bg-black-3 p-6">
        <p className="font-display text-xl font-light text-ivory">A heads-up on your phone.</p>
        <p className="mt-2 text-base leading-relaxed text-silver">
          On iPhone this works once Christ Fields is on your Home Screen: tap Share, then Add to Home Screen. Open it
          from there and come back here.
        </p>
        <DismissButton onClick={onDismiss}>Not now</DismissButton>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-sm border border-border-gold bg-black-3 p-6">
      <p className="font-display text-xl font-light text-ivory">Want a heads-up on your phone?</p>
      <p className="mt-2 text-base leading-relaxed text-silver">
        When a leader posts, moves, or calls something off, and the day before you said you are in. Nothing else.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (await enable()) onDone();
          }}
          className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt disabled:opacity-60"
        >
          {busy ? 'One moment' : 'Yes, tell me'}
        </button>
        <DismissButton onClick={onDismiss}>Not now</DismissButton>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </section>
  );
}

function DismissButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:border-ivory/40 hover:text-ivory"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ You */

export function PushSettingsCard() {
  const { state, busy, error, enable, disable } = usePush();

  let body: React.ReactNode;
  if (state === 'loading') body = null;
  else if (state === 'unconfigured') body = <p className="mt-3 text-sm text-muted">Phone alerts are not switched on for this site yet.</p>;
  else if (state === 'unsupported') body = <p className="mt-3 text-sm text-muted">This browser cannot show alerts. Emails still work.</p>;
  else if (state === 'needs_install')
    body = (
      <p className="mt-3 text-sm leading-relaxed text-silver">
        On iPhone, add Christ Fields to your Home Screen first (Share, then Add to Home Screen), open it from there,
        and this switch will work.
      </p>
    );
  else if (state === 'blocked')
    body = (
      <p className="mt-3 text-sm leading-relaxed text-silver">
        Alerts are blocked for this site in your browser settings. Allow them there and come back.
      </p>
    );
  else
    body = (
      <div className="mt-4">
        <button
          type="button"
          role="switch"
          aria-checked={state === 'on'}
          disabled={busy}
          onClick={() => (state === 'on' ? disable() : enable())}
          className={cn(
            'inline-flex min-h-[44px] items-center gap-3 rounded-sm border px-4 text-sm transition-colors',
            state === 'on' ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
          )}
        >
          <span aria-hidden className={cn('relative inline-block h-5 w-9 rounded-full transition-colors', state === 'on' ? 'bg-gold' : 'bg-black-4')}>
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform', state === 'on' ? 'left-4' : 'left-0.5')} />
          </span>
          {state === 'on' ? 'Alerts are on for this device' : 'Alerts are off'}
        </button>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>
    );

  return (
    <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-6">
      <h3 className="font-display text-xl font-light text-ivory">A heads-up on this phone</h3>
      <p className="mt-1 text-sm leading-relaxed text-silver">
        When a leader posts, moves, or calls something off, and the day before you said you are in. Each device has
        its own switch. When alerts work, we skip the email for new posts.
      </p>
      {body}
    </section>
  );
}

/* ------------------------------------------------------------ re-own on change */

export function PushSync() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  useEffect(() => {
    if (!isLoaded || !userId || !supported() || !VAPID_PUBLIC) return;
    if (Notification.permission !== 'granted') return;
    let stored = '';
    try {
      stored = localStorage.getItem(LS_KEY) || '';
    } catch {
      stored = '';
    }
    const [endpoint, owner] = stored.split('|');
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!sub) return;
        // Same device, same member, same endpoint: nothing to say.
        if (sub.endpoint === endpoint && owner === userId) return;
        if (await postSubscription(sub)) remember(sub.endpoint, userId);
      } catch {
        // best effort
      }
    })();
  }, [isLoaded, userId]);
  return null;
}
