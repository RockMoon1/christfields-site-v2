'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LeaderEventView, RosterName } from '@/app/dashboard/(app)/lead/actions';
import { cancelEvent, markAttendance, markEveryoneCame, postThanks, nudgeEvent } from '@/app/dashboard/(app)/lead/actions';
import { noteLines } from '@/lib/dashboard/prompts';
import { Face } from '@/components/dashboard/GoingFaces';

/**
 * What a leader sees under an event: who answered and who has not, first-timers,
 * gaps in the bring and ride lists, questions that might come up, who came,
 * a share block for the group chat, and Change / Call it off.
 */
export function LeaderStrip({ view, whenText }: { view: LeaderEventView; whenText: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<'going' | 'maybe' | 'cant' | 'silent' | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [thanks, setThanks] = useState(view.thanksNote);
  const [nudge, setNudge] = useState<{ done: boolean; line: string }>({ done: view.nudged, line: '' });
  const [attendance, setAttendance] = useState<Map<string, boolean>>(
    () => new Map([...view.going, ...view.maybe, ...view.silent, ...view.cant].filter((p) => p.present !== null).map((p) => [p.userId, p.present as boolean])),
  );
  const cancelled = view.event.status === 'cancelled';
  const started = new Date(view.event.startsAt).getTime() <= Date.now();
  const leaderLines = noteLines(view.leaderNote, 3);
  const firstTimers = [...view.going, ...view.maybe].filter((p) => p.firstTime);

  async function copy() {
    try {
      await navigator.clipboard.writeText(view.shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function toggleCame(p: RosterName) {
    const next = !(attendance.get(p.userId) ?? false);
    setAttendance((prev) => new Map(prev).set(p.userId, next));
    startTransition(async () => {
      const res = await markAttendance(view.event.id, p.userId, next).catch(() => ({ ok: false }));
      if (!res.ok) setAttendance((prev) => new Map(prev).set(p.userId, !next));
    });
  }

  const Count = ({ label, list, kind }: { label: string; list: RosterName[]; kind: typeof open }) => (
    <button
      type="button"
      onClick={() => setOpen(open === kind ? null : kind)}
      aria-expanded={open === kind}
      className={cn(
        'min-h-[44px] rounded-sm border px-3 text-left text-sm',
        open === kind ? 'border-border-gold bg-gold/10 text-gold-lt' : 'border-border-sub text-silver hover:text-ivory',
      )}
    >
      <span className="text-ivory">{list.length}</span> {label}
    </button>
  );
  const openList = open === 'going' ? view.going : open === 'maybe' ? view.maybe : open === 'cant' ? view.cant : open === 'silent' ? view.silent : [];

  return (
    <section className="rounded-sm border border-border-gold bg-black-3 p-5 md:p-6">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">You lead this</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Count label="in" list={view.going} kind="going" />
        <Count label="not sure" list={view.maybe} kind="maybe" />
        <Count label={view.silent.length === 1 ? 'has not answered' : 'have not answered'} list={view.silent} kind="silent" />
        <Count label={view.cant.length === 1 ? 'cannot' : 'cannot'} list={view.cant} kind="cant" />
      </div>
      {open && (
        <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
          {openList.length === 0 ? 'Nobody.' : openList.map((p) => p.name).join(', ')}
        </p>
      )}

      {view.canNudge && !nudge.done && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await nudgeEvent(view.event.id).catch(() => null);
              if (!res || !res.ok) {
                setNudge({ done: false, line: 'Could not send that. Try again in a minute.' });
                return;
              }
              const reached = res.pushed + res.emailed;
              const parts: string[] = [];
              if (res.pushed) parts.push(`${res.pushed} phone ${res.pushed === 1 ? 'alert' : 'alerts'}`);
              if (res.emailed) parts.push(`${res.emailed} ${res.emailed === 1 ? 'email' : 'emails'}`);
              const tail: string[] = [];
              if (res.skippedBudget) tail.push(`${res.skippedBudget} could not be emailed today`);
              if (res.unreachable) tail.push(`${res.unreachable} ${res.unreachable === 1 ? 'has' : 'have'} no way to be reached`);
              setNudge({
                done: true,
                line: res.already
                  ? 'Already nudged for this one.'
                  : reached === 0
                    ? 'Nobody could be reached right now. Paste the share text into the group chat.'
                    : `Sent ${parts.join(' and ')}.${tail.length ? ` ${tail.join('; ')}. Paste the share text into the group chat for them.` : ''}`,
              });
            })
          }
          className="mt-3 inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black disabled:opacity-60"
        >
          {view.silent.length === 1 ? `Nudge ${view.silent[0].name}` : `Nudge the ${view.silent.length} who have not answered`}
        </button>
      )}
      {nudge.line && <p className="mt-2 text-sm text-ivory-dim">{nudge.line}</p>}
      {nudge.done && !nudge.line && view.canNudge && <p className="mt-2 text-xs text-muted">Nudged once already. Once is the limit.</p>}

      {firstTimers.length > 0 && (
        <p className="mt-3 rounded-sm border-l-2 border-gold/60 bg-black-2/60 px-4 py-2 text-sm text-ivory-dim">
          {firstTimers.map((p) => p.name).join(' and ')} {firstTimers.length === 1 ? 'is' : 'are'} coming for the first time. Say
          their name back to them.
        </p>
      )}

      {view.slots.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-silver">
          {view.slots.map((s) => (
            <li key={s.id}>
              <span className="text-ivory">{s.label}</span>: {s.taken >= s.capacity ? 'covered' : s.kind === 'ride' ? `${s.capacity - s.taken} seats open` : 'nobody yet'}
              {s.claimants.length > 0 ? ` (${s.claimants.join(', ')})` : ''}
            </li>
          ))}
        </ul>
      )}

      {view.skippedEmails > 0 && (
        <p className="mt-3 text-sm text-gold-lt">
          {view.skippedEmails === 1 ? '1 person' : `${view.skippedEmails} people`} could not be emailed today. Paste the share text into the group chat.
        </p>
      )}

      {leaderLines.length > 0 && !cancelled && (
        <div className="mt-4 rounded-sm border border-border-sub bg-black-2/60 px-4 py-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Questions that might come up</p>
          <ul className="space-y-1">
            {leaderLines.map((l) => (
              <li key={l} className="text-sm leading-snug text-ivory-dim">
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view.attendanceOpen && (
        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Who came?</p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await markEveryoneCame(view.event.id);
                  router.refresh();
                })
              }
              className="text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:text-gold-lt"
            >
              Everyone who said yes came
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...view.going, ...view.maybe, ...view.silent].map((p) => {
              const came = attendance.get(p.userId) ?? false;
              return (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => toggleCame(p)}
                  aria-pressed={came}
                  className={cn(
                    'inline-flex min-h-[44px] items-center gap-2 rounded-sm border px-3 text-sm',
                    came ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver',
                  )}
                >
                  <Face face={{ displayName: p.name, imageUrl: p.imageUrl }} size={24} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {started && !cancelled && (
        <div className="mt-5">
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-muted" htmlFor="thanks">
            A line of thanks (everyone sees it on Home for a week)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="thanks"
              type="text"
              value={thanks}
              onChange={(e) => setThanks(e.target.value)}
              maxLength={240}
              placeholder="Thanks for coming, all eleven of you."
              className="min-h-[44px] flex-1 rounded-sm border border-border-sub bg-black-2 px-3 text-base text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
            />
            <button
              type="button"
              disabled={pending || !thanks.trim()}
              onClick={() =>
                startTransition(async () => {
                  await postThanks(view.event.id, thanks);
                  router.refresh();
                })
              }
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-gold px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-black hover:bg-gold-lt disabled:opacity-60"
            >
              Post thanks
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border-sub pt-4">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-[44px] items-center rounded-sm border border-gold/45 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-gold hover:bg-gold hover:text-black"
        >
          {copied ? 'Copied' : 'Copy for the group chat'}
        </button>
        {!cancelled && (
          <Link
            href={`/dashboard/e/${view.event.id}/edit`}
            className="inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-silver hover:text-ivory"
          >
            Change it
          </Link>
        )}
        {!cancelled && !cancelling && (
          <button
            type="button"
            onClick={() => setCancelling(true)}
            className="inline-flex min-h-[44px] items-center rounded-sm border border-border-sub px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:text-red-300"
          >
            Call it off
          </button>
        )}
      </div>

      {cancelling && (
        <div className="mt-3 rounded-sm border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-ivory">Everyone will be told right away. Why is it off?</p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="e.g. Snow. We will try next week."
            className="mt-2 min-h-[44px] w-full rounded-sm border border-border-sub bg-black-2 px-3 text-base text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await cancelEvent(view.event.id, reason);
                  setCancelling(false);
                  router.refresh();
                })
              }
              className="inline-flex min-h-[44px] items-center rounded-sm bg-red-500/80 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-white hover:bg-red-500 disabled:opacity-60"
            >
              Yes, call it off
            </button>
            <button type="button" onClick={() => setCancelling(false)} className="min-h-[44px] px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
              Keep it
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted">{whenText}</p>
    </section>
  );
}
