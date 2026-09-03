'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import type { EventRsvpStatus } from '@/lib/supabase';
import { GoingFaces } from '@/components/dashboard/GoingFaces';
import { AddToCalendar } from '@/components/dashboard/AddToCalendar';
import { SuccessCheck } from '@/components/motion/SuccessCheck';
import { viewByToken, rsvpByToken, planByToken, type TokenView } from './actions';

const PLANS: { key: string; label: string }[] = [
  { key: 'after_work', label: 'Right after work' },
  { key: 'hour_before', label: 'About an hour before' },
  { key: 'unsure', label: 'Not sure yet' },
];

export function TokenAnswer({ eventId }: { eventId: string }) {
  const [view, setView] = useState<TokenView | null | 'loading' | 'invalid'>('loading');
  const [status, setStatus] = useState<EventRsvpStatus | null>(null);
  const [plan, setPlan] = useState('');
  const [answered, setAnswered] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const m = /(?:^|[#&])t=([^&]+)/.exec(window.location.hash);
    const token = m ? decodeURIComponent(m[1]) : '';
    if (!token) {
      setView('invalid');
      return;
    }
    viewByToken(token, eventId)
      .then((v) => {
        if (!v) {
          setView('invalid');
          return;
        }
        setView(v);
        setStatus(v.myStatus);
        setPlan(v.myPlan);
      })
      .catch(() => setView('invalid'));
  }, [eventId]);

  if (view === 'loading') {
    return <p className="text-center text-sm text-muted">One moment…</p>;
  }
  if (view === 'invalid' || view === null) {
    return (
      <div className="rounded-sm border border-border-sub bg-black-3 p-6 text-center">
        <p className="font-display text-xl text-ivory">This link has expired.</p>
        <p className="mt-2 text-sm text-silver">Open Christ Fields to see what is coming up.</p>
        <Link href="/dashboard" className="mt-4 inline-flex min-h-[44px] items-center rounded-sm bg-gold px-5 text-[11px] font-medium uppercase tracking-[0.1em] text-black">
          Open Christ Fields
        </Link>
      </div>
    );
  }

  const v = view;

  function choose(next: EventRsvpStatus) {
    const prev = status;
    setStatus(next);
    setAnswered(true);
    startTransition(async () => {
      const res = await rsvpByToken(v.token, eventId, next).catch(() => ({ ok: false as const }));
      if (!res.ok) {
        setStatus(prev);
        setAnswered(false);
        return;
      }
      if (res.faces) setView({ ...v, faces: res.faces });
    });
  }

  return (
    <article className="rounded-sm border border-border-gold bg-black-3 p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">{v.event.orgName}</p>
      <h1 className="mt-1 font-display text-3xl font-light leading-tight text-ivory">{v.event.title}</h1>
      <p className="mt-2 text-lg text-ivory-dim">{v.whenText}</p>
      {v.event.location && <p className="mt-1 text-sm text-silver">{v.event.location}</p>}
      {v.event.description && <p className="mt-3 text-base leading-relaxed text-silver">{v.event.description}</p>}

      <div className="mt-4">
        <GoingFaces faces={v.faces} />
      </div>

      {v.event.status === 'cancelled' ? (
        <p className="mt-5 text-sm text-silver">This one was called off.</p>
      ) : answered && status && status !== 'not_going' ? (
        <div className="mt-5 rounded-sm border border-border-gold bg-gold/[0.06] p-4">
          <div className="flex items-center gap-3">
            <SuccessCheck size={36} />
            <p className="font-display text-xl text-ivory">{status === 'going' ? `You are in. ${v.whenText}.` : 'Noted. We will remind you.'}</p>
          </div>
          <div className="mt-4">
            <AddToCalendar eventId={eventId} googleUrl={v.googleUrl} token={v.token} />
          </div>
          <div className="mt-5">
            <p className="text-sm text-ivory">When will you head out?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLANS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={plan === o.key}
                  onClick={() => {
                    const next = plan === o.key ? '' : o.key;
                    setPlan(next);
                    startTransition(async () => {
                      await planByToken(v.token, eventId, next).catch(() => undefined);
                    });
                  }}
                  className={cn(
                    'inline-flex min-h-[44px] items-center rounded-sm border px-4 text-sm',
                    plan === o.key ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <Link href={`/dashboard/e/${eventId}`} className="mt-5 inline-block text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:text-gold-lt">
            Open Christ Fields &rarr;
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-2">
          {(
            [
              ['going', "I'm in"],
              ['maybe', 'Not sure yet'],
              ['not_going', "I can't make it"],
            ] as [EventRsvpStatus, string][]
          ).map(([s, label]) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              aria-pressed={status === s}
              onClick={() => choose(s)}
              className={cn(
                'inline-flex min-h-[52px] w-full items-center justify-center rounded-sm border px-4 text-base font-medium transition-colors',
                status === s
                  ? 'border-transparent bg-gold text-black'
                  : s === 'going'
                    ? 'border-gold/60 text-gold hover:bg-gold hover:text-black'
                    : 'border-border-sub bg-black-2 text-silver hover:text-ivory',
              )}
            >
              {label}
            </button>
          ))}
          {answered && status === 'not_going' && <p className="text-center text-sm text-silver">Thanks for letting us know.</p>}
        </div>
      )}
    </article>
  );
}
