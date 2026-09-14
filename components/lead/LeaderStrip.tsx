'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LeaderEventView, RosterName } from '@/app/dashboard/(app)/lead/actions';
import { cancelEvent, markAttendance, markEveryoneCame, postThanks, nudgeEvent } from '@/app/dashboard/(app)/lead/actions';
import { noteLines } from '@/lib/dashboard/prompts';
import { Face } from '@/components/dashboard/GoingFaces';
import { Button } from '@/components/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Notice } from '@/components/ui/Notice';

type RosterKind = 'going' | 'maybe' | 'cant' | 'silent';
type Action = 'attendance' | 'everyone' | 'thanks' | 'cancel' | 'nudge' | 'copy';
type Feedback = { message: string; tone: 'problem' | 'saved' | 'info' };
type FocusTarget = HTMLElement | 'heading' | 'cancel' | 'reason' | 'share';
const failure: Record<Action, string> = {
  attendance: 'Could not confirm this attendance change. Check the names and try again.',
  everyone: 'Could not confirm attendance. Check the names and try again.',
  thanks: 'Could not confirm that thanks was posted. Your words are still here. Check the event before trying again.',
  cancel: 'Could not confirm the cancellation. Your reason is still here. Check the event before trying again.',
  nudge: 'Could not send that. Try again in a minute.',
  copy: 'Could not copy the share text. Select the text below and copy it.',
};

function attendanceFrom(view: LeaderEventView) {
  return new Map([...view.going, ...view.maybe, ...view.silent, ...view.cant]
    .filter(person => person.present !== null).map(person => [person.userId, person.present as boolean]));
}

// A stable component type keeps the focused roster button mounted on updates.
function Count({ label, list, kind, open, onToggle, controls }: {
  label: string; list: RosterName[]; kind: RosterKind; open: RosterKind | null;
  onToggle: (kind: RosterKind | null) => void; controls: string;
}) {
  return <button type="button" onClick={() => onToggle(open === kind ? null : kind)}
    aria-expanded={open === kind} aria-controls={controls}
    className={cn('min-h-11 min-w-0 rounded-sm border px-3 py-3 text-left text-sm leading-relaxed transition-colors duration-200 [overflow-wrap:anywhere]',
      open === kind ? 'border-border-gold bg-gold/10 text-gold-lt' : 'border-border-sub text-silver hover:text-ivory focus-visible:text-ivory')}>
    <span className="text-ivory">{list.length}</span> {label}
  </button>;
}

/** Leader-only planning, attendance and event actions. Service contracts and
 * visibility gates stay intact; none of this data enters the member payload. */
export function LeaderStrip({ view, whenText }: { view: LeaderEventView; whenText: string }) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState<Action | null>(null);
  const inFlight = useRef(false);
  const [open, setOpen] = useState<RosterKind | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [thanks, setThanks] = useState(view.thanksNote);
  const [nudged, setNudged] = useState(view.nudged);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [feedback, setFeedback] = useState<Partial<Record<Action, Feedback>>>({});
  const [attendance, setAttendance] = useState(() => attendanceFrom(view));
  const lastView = useRef(view);
  const heading = useRef<HTMLHeadingElement>(null);
  const cancelTrigger = useRef<HTMLButtonElement>(null);
  const reasonInput = useRef<HTMLInputElement>(null);
  const shareInput = useRef<HTMLTextAreaElement>(null);
  const focusRequest = useRef<{ target: FocusTarget; origin: HTMLElement | null } | null>(null);
  const cancelled = view.event.status === 'cancelled';
  const started = new Date(view.event.startsAt).getTime() <= Date.now();
  const leaderLines = noteLines(view.leaderNote, 3);
  const firstTimers = [...view.going, ...view.maybe].filter(person => person.firstTime);
  const openList = open ? view[open] : [];

  // Bulk attendance must display the refreshed record, not infer that every
  // write succeeded from the action's boolean. Preserve an in-flight edit.
  useEffect(() => {
    if (pending || lastView.current === view) return;
    lastView.current = view;
    setAttendance(attendanceFrom(view));
  }, [pending, view]);

  useEffect(() => {
    if (pending || !focusRequest.current) return;
    const { target, origin } = focusRequest.current;
    focusRequest.current = null;
    const active = document.activeElement;
    if (active !== document.body && active !== document.documentElement && active !== origin) return;
    const element = typeof target !== 'string' ? target : target === 'heading' ? heading.current
      : target === 'cancel' ? cancelTrigger.current : target === 'reason' ? reasonInput.current : shareInput.current;
    element?.focus();
  }, [pending, working, cancelling, showShare, nudged]);

  function announce(action: Action, message: string, tone: Feedback['tone'] = 'saved') {
    setFeedback(previous => ({ ...previous, [action]: { message, tone } }));
  }

  // One mutation at a time prevents bulk/individual attendance and cancellation
  // racing. Each caller owns its success and rollback semantics.
  function perform<T extends { ok: boolean }>(action: Action, origin: HTMLElement,
    request: () => Promise<T>, onSuccess: (result: T) => void, onFailure?: () => void) {
    if (pending || inFlight.current) return;
    inFlight.current = true;
    setWorking(action);
    setFeedback(previous => ({ ...previous, [action]: undefined }));
    startTransition(async () => {
      let result: T | null = null;
      try { result = await request(); } catch { /* Transport failure uses the same recovery path. */ }
      if (result?.ok) onSuccess(result);
      else { onFailure?.(); announce(action, failure[action], 'problem'); }
      if (!focusRequest.current) focusRequest.current = { target: origin, origin };
      inFlight.current = false;
      setWorking(null);
    });
  }

  function toggleCame(person: RosterName, origin: HTMLElement) {
    if (pending || inFlight.current) return;
    const previous = attendance.get(person.userId);
    const next = !(previous ?? false);
    setAttendance(current => new Map(current).set(person.userId, next));
    perform('attendance', origin, () => markAttendance(view.event.id, person.userId, next), () => {
      announce('attendance', 'Attendance saved.');
    }, () => setAttendance(current => {
      const restored = new Map(current);
      if (previous === undefined) restored.delete(person.userId);
      else restored.set(person.userId, previous);
      return restored;
    }));
  }

  function nudge(origin: HTMLElement) {
    perform('nudge', origin, () => nudgeEvent(view.event.id), result => {
      const reached = result.pushed + result.emailed;
      const parts: string[] = [], tail: string[] = [];
      if (result.pushed) parts.push(`${result.pushed} phone ${result.pushed === 1 ? 'alert' : 'alerts'}`);
      if (result.emailed) parts.push(`${result.emailed} ${result.emailed === 1 ? 'email' : 'emails'}`);
      if (result.skippedBudget) tail.push(`${result.skippedBudget} could not be emailed today`);
      if (result.unreachable) tail.push(`${result.unreachable} ${result.unreachable === 1 ? 'has' : 'have'} no way to be reached`);
      announce('nudge', result.already ? 'Already nudged for this one.' : reached === 0
        ? 'Nobody could be reached right now. Paste the share text into the group chat.'
        : `Sent ${parts.join(' and ')}.${tail.length ? ` ${tail.join('; ')}. Paste the share text into the group chat for them.` : ''}`, 'info');
      setNudged(true);
      focusRequest.current = { target: 'heading', origin };
    });
  }

  function copy(origin: HTMLElement) {
    const text = view.shareText;
    perform('copy', origin, async () => { await navigator.clipboard.writeText(text); return { ok: true }; }, () => {
      setCopiedText(text); announce('copy', 'Share text copied.');
    }, () => {
      setCopiedText(null); setShowShare(true);
      focusRequest.current = { target: 'share', origin };
    });
  }

  return <section aria-labelledby={`${id}-heading`} className="rounded-sm border border-border-gold bg-black-3 p-5 md:p-6 [overflow-wrap:anywhere]">
    <h2 id={`${id}-heading`} ref={heading} tabIndex={-1} className="mb-5 font-display text-2xl leading-tight text-ivory">You lead this</h2>

    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Count label="in" list={view.going} kind="going" open={open} onToggle={setOpen} controls={`${id}-roster`} />
      <Count label="not sure" list={view.maybe} kind="maybe" open={open} onToggle={setOpen} controls={`${id}-roster`} />
      <Count label={view.silent.length === 1 ? 'has not answered' : 'have not answered'} list={view.silent} kind="silent" open={open} onToggle={setOpen} controls={`${id}-roster`} />
      <Count label="cannot" list={view.cant} kind="cant" open={open} onToggle={setOpen} controls={`${id}-roster`} />
    </div>
    <p id={`${id}-roster`} hidden={!open} className="mt-3 text-sm leading-relaxed text-ivory-dim">
      {openList.length === 0 ? 'Nobody.' : openList.map(person => person.name).join(', ')}
    </p>

    {view.canNudge && !nudged && <Button fx={false} variant="ghost" size="sm" className="mt-4"
      disabled={pending} pending={pending && working === 'nudge'} pendingLabel="Sending…" onClick={event => nudge(event.currentTarget)}>
      {view.silent.length === 1 ? `Nudge ${view.silent[0].name}` : `Nudge the ${view.silent.length} who have not answered`}
    </Button>}
    <Notice message={feedback.nudge?.message} tone={feedback.nudge?.tone} className={feedback.nudge ? 'mt-3' : undefined} />
    {nudged && !feedback.nudge && view.canNudge && <p className="mt-3 text-sm text-muted">Nudged once already. Once is the limit.</p>}

    {firstTimers.length > 0 && <p className="mt-4 border-l-2 border-gold/60 bg-black-2/60 px-4 py-3 text-sm leading-relaxed text-ivory-dim">
      {firstTimers.map(person => person.name).join(' and ')} {firstTimers.length === 1 ? 'is' : 'are'} coming for the first time. Say their name back to them.
    </p>}

    {view.slots.length > 0 && <ul className="mt-4 space-y-2 text-sm leading-relaxed text-silver">
      {view.slots.map(slot => <li key={slot.id}>
        <span className="text-ivory">{slot.label}</span>: {slot.taken >= slot.capacity ? 'covered' : slot.kind === 'ride' ? `${slot.capacity - slot.taken} seats open` : 'nobody yet'}
        {slot.claimants.length > 0 ? ` (${slot.claimants.join(', ')})` : ''}
      </li>)}
    </ul>}
    {view.skippedEmails > 0 && <p className="mt-4 text-sm leading-relaxed text-gold-lt">
      {view.skippedEmails === 1 ? '1 person' : `${view.skippedEmails} people`} could not be emailed today. Paste the share text into the group chat.
    </p>}

    {leaderLines.length > 0 && !cancelled && <div className="mt-5 border-t border-border-sub pt-4">
      <h3 className="mb-2 text-meta font-medium uppercase tracking-[0.12em] text-muted">Questions that might come up</h3>
      <ul className="space-y-2 text-sm leading-relaxed text-ivory-dim">{leaderLines.map(line => <li key={line}>{line}</li>)}</ul>
    </div>}
    {view.contextNotes && !cancelled && <div className="mt-5 border-t border-border-sub pt-4">
      <h3 className="mb-2 text-meta font-medium uppercase tracking-[0.12em] text-muted">Context for you (only leaders see this)</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ivory-dim">{view.contextNotes}</p>
    </div>}

    {view.attendanceOpen && <div className="mt-6 border-t border-border-sub pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-meta font-medium uppercase tracking-[0.16em] text-gold">Who came?</h3>
        <Button fx={false} variant="quiet" size="sm" disabled={pending} pending={pending && working === 'everyone'} pendingLabel="Checking attendance…"
          onClick={event => perform('everyone', event.currentTarget, () => markEveryoneCame(view.event.id), () => {
            router.refresh(); announce('everyone', 'Attendance refreshed. Check the names below.', 'info');
          })}>Everyone who said yes came</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {[...view.going, ...view.maybe, ...view.silent].map(person => {
          const came = attendance.get(person.userId) ?? false;
          return <button key={person.userId} type="button" disabled={pending} onClick={event => toggleCame(person, event.currentTarget)} aria-pressed={came}
            className={cn('inline-flex min-h-11 max-w-full items-center gap-2 rounded-sm border px-3 py-2 text-sm leading-relaxed transition-colors duration-200 disabled:cursor-wait',
              came ? 'border-border-gold bg-gold/15 text-gold-lt' : 'border-border-sub text-silver hover:text-ivory focus-visible:text-ivory')}>
            <Face face={{ displayName: person.name, imageUrl: person.imageUrl }} size={24} /><span className="min-w-0">{person.name}</span>
          </button>;
        })}
      </div>
      <Notice message={feedback.attendance?.message} tone={feedback.attendance?.tone} className={feedback.attendance ? 'mt-3' : undefined} />
      <Notice message={feedback.everyone?.message} tone={feedback.everyone?.tone} className={feedback.everyone ? 'mt-3' : undefined} />
    </div>}

    {started && !cancelled && <form className="mt-6 border-t border-border-sub pt-5" onSubmit={event => {
      event.preventDefault();
      if (!thanks.trim()) return;
      const origin = event.currentTarget.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      perform('thanks', origin, () => postThanks(view.event.id, thanks), () => { router.refresh(); announce('thanks', 'Thanks posted.'); });
    }}>
      <Field id={`${id}-thanks`} label="A line of thanks (everyone sees it on Home for a week)">
        <Input value={thanks} onChange={event => setThanks(event.target.value)} disabled={pending} maxLength={240} placeholder="Thanks for coming, all eleven of you." />
      </Field>
      <Button type="submit" fx={false} size="sm" disabled={pending || !thanks.trim()} pending={pending && working === 'thanks'} pendingLabel="Posting thanks…">Post thanks</Button>
      <Notice message={feedback.thanks?.message} tone={feedback.thanks?.tone} className={feedback.thanks ? 'mt-3' : undefined} />
    </form>}

    <div className="mt-6 flex flex-wrap gap-2 border-t border-border-sub pt-5">
      <Button fx={false} variant="ghost" size="sm" disabled={pending} pending={pending && working === 'copy'} pendingLabel="Copying…" onClick={event => copy(event.currentTarget)}>
        {copiedText === view.shareText ? 'Copied' : 'Copy for the group chat'}
      </Button>
      {!cancelled && <Link href={`/dashboard/e/${view.event.id}/edit`}
        className="inline-flex min-h-11 items-center rounded-sm border border-border-sub px-4 py-2 text-sm font-medium text-silver transition-colors duration-200 hover:text-ivory focus-visible:text-ivory">Change it</Link>}
      {!cancelled && !cancelling && <Button ref={cancelTrigger} fx={false} variant="quiet" size="sm" disabled={pending} onClick={event => {
        focusRequest.current = { target: 'reason', origin: event.currentTarget }; setCancelling(true);
      }}>Call it off</Button>}
    </div>
    <Notice message={feedback.copy?.message} tone={feedback.copy?.tone} className={feedback.copy ? 'mt-3' : undefined} />
    {showShare && <Field id={`${id}-share`} label="Share text for the group chat" className="mt-3">
      <Textarea ref={shareInput} readOnly value={view.shareText} rows={5} onFocus={event => event.currentTarget.select()} />
    </Field>}

    {cancelling && <form className="mt-4 rounded-sm border border-danger/40 bg-danger-dk/20 p-4" onSubmit={event => {
      event.preventDefault();
      const origin = event.currentTarget.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      perform('cancel', origin, () => cancelEvent(view.event.id, reason), () => {
        setCancelling(false); setReason(''); router.refresh(); announce('cancel', 'Event called off.');
        focusRequest.current = { target: 'heading', origin };
      });
    }}>
      <Field id={`${id}-reason`} label="Why is it off?" hint="Everyone will be told right away.">
        <Input ref={reasonInput} value={reason} onChange={event => setReason(event.target.value)} disabled={pending} maxLength={200} placeholder="e.g. Snow. We will try next week." />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" fx={false} variant="danger" size="sm" disabled={pending} pending={pending && working === 'cancel'} pendingLabel="Calling it off…">Yes, call it off</Button>
        <Button fx={false} variant="quiet" size="sm" disabled={pending} onClick={event => {
          focusRequest.current = { target: 'cancel', origin: event.currentTarget }; setCancelling(false);
        }}>Keep it</Button>
      </div>
    </form>}
    <Notice message={feedback.cancel?.message} tone={feedback.cancel?.tone} className={feedback.cancel ? 'mt-3' : undefined} />
    <p className="mt-4 text-sm text-muted">{whenText}</p>
  </section>;
}
