'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { HomeSlotCard } from '@/app/dashboard/(app)/events/actions';
import { dismissHomeCard, type HomeCardKind } from '@/app/dashboard/(app)/settings/actions';
import { InstallAppCard } from './InstallAppCard';
import { PushPrimerCard } from './PushSetup';

/**
 * Home carries one ask at a time. The server picks the card (hello, a
 * thank-you from last time, help your leader pick times, add to Home Screen,
 * phone alerts); this component renders it and lets the member wave it away
 * for good with one tap. Environment checks live here because only the
 * browser knows if it is installed or can install.
 */
export function HomeSlot({ card, firstName }: { card: HomeSlotCard; firstName: string }) {
  const router = useRouter();
  const [gone, setGone] = useState(false);
  const [, startTransition] = useTransition();
  const [env, setEnv] = useState<{ standalone: boolean; inApp: boolean } | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = window.navigator.userAgent.toLowerCase();
    const inApp = /instagram|fban|fbav|messenger|gsa\/|line\/|twitter/.test(ua);
    setEnv({ standalone, inApp });
  }, []);

  function dismiss(kind: HomeCardKind) {
    setGone(true);
    startTransition(async () => {
      await dismissHomeCard(kind).catch(() => undefined);
      router.refresh();
    });
  }

  if (gone) return null;

  if (card.kind === 'hello') {
    return (
      <Card>
        <p className="font-display text-2xl font-light text-ivory">Hi {firstName}.</p>
        <p className="mt-2 text-base leading-relaxed text-silver">
          This is where you will see what {card.orgName} is doing next. When you can make something, tap
          <span className="text-ivory"> I&rsquo;m in</span>. That is it.
        </p>
        <Dismiss onClick={() => dismiss('hello')}>Got it</Dismiss>
      </Card>
    );
  }

  if (card.kind === 'recently') {
    return (
      <Card>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Last time</p>
        <p className="mt-1 font-display text-xl font-light text-ivory">{card.title}</p>
        <p className="mt-2 text-base leading-relaxed text-silver">{card.thanks}</p>
        <Link href={`/dashboard/e/${card.eventId}`} className="mt-3 inline-block text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:text-gold-lt">
          See it &rarr;
        </Link>
      </Card>
    );
  }

  if (card.kind === 'rhythm') {
    return (
      <Card>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">It has been a couple of weeks</p>
        <p className="mt-1 font-display text-xl font-light text-ivory">
          {card.title} is {card.when}.
        </p>
        <p className="mt-2 text-base leading-relaxed text-silver">It would be good to see you. No pressure, just the door open.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/e/${card.eventId}`}
            onClick={() => dismiss('rhythm')}
            className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
          >
            See it
          </Link>
          <Dismiss onClick={() => dismiss('rhythm')}>Not this time</Dismiss>
        </div>
      </Card>
    );
  }

  if (card.kind === 'quiet') {
    return <QuietSlot question={card.question} weekKey={card.weekKey} />;
  }

  if (card.kind === 'free') {
    return (
      <Card>
        <p className="font-display text-xl font-light text-ivory">Help your leader pick times that work.</p>
        <p className="mt-2 text-base leading-relaxed text-silver">
          Tap the times you are usually free. Your leader only ever sees free or busy, never what you are doing.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/availability"
            onClick={() => dismiss('free')}
            className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
          >
            Show me
          </Link>
          <Dismiss onClick={() => dismiss('free')}>Not now</Dismiss>
        </div>
      </Card>
    );
  }

  if (card.kind === 'install') {
    if (!env) return null;
    // Already installed, or inside an in-app browser where installing is impossible: skip for good.
    if (env.standalone || env.inApp) {
      dismiss('install');
      return null;
    }
    return (
      <div className="relative">
        <InstallAppCard />
        <div className="-mt-4 mb-6 flex justify-end">
          <Dismiss onClick={() => dismiss('install')}>Not now</Dismiss>
        </div>
      </div>
    );
  }

  // Phone alerts. The card decides for itself whether this device can even do it.
  return <PushPrimerCard onDone={() => dismiss('push')} onDismiss={() => dismiss('push')} />;
}

/** Weekly, and "not this week" is remembered on this device only: nothing to store about a person for skipping a question. */
function QuietSlot({ question, weekKey }: { question: string; weekKey: string }) {
  const storageKey = `cf_quiet_skip_${weekKey}`;
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === '1') setHidden(true);
    } catch {
      // ignore
    }
  }, [storageKey]);
  if (hidden) return null;
  return (
    <Card>
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">A quiet question</p>
      <p className="mt-1 font-display text-xl font-light leading-snug text-ivory">{question}</p>
      <p className="mt-2 text-sm leading-relaxed text-silver">Between you and God. Nobody reads it. You get a verse back.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/quiet"
          className="inline-flex min-h-[44px] items-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt"
        >
          Answer quietly
        </Link>
        <Dismiss
          onClick={() => {
            try {
              localStorage.setItem(storageKey, '1');
            } catch {
              // ignore
            }
            setHidden(true);
          }}
        >
          Not this week
        </Dismiss>
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="mb-6 rounded-sm border border-border-gold bg-black-3 p-6">{children}</section>;
}

function Dismiss({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:border-ivory/40 hover:text-ivory"
    >
      {children}
    </button>
  );
}
