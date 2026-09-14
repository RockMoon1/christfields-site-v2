'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Notice } from '@/components/ui/Notice';
import { Surface } from '@/components/ui/Surface';

/** An illustrative member experience, not an authenticated dashboard. Sample
 * details and interactions live only in component state: no service calls,
 * storage, calendar links, or real prayer requests belong in this preview.
 * Existing Scripture wording is retained without claiming a verified edition. */
const ANSWERS = [
  { value: 'going', label: 'I’m in' },
  { value: 'maybe', label: 'Not sure yet' },
  { value: 'not_going', label: 'I can’t make it' },
] as const;

type Answer = (typeof ANSWERS)[number]['value'];

export function DashboardPreview() {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [prayed, setPrayed] = useState(false);
  const [calendar, setCalendar] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const calendarRef = useRef<HTMLDetailsElement>(null);

  function reset() {
    setAnswer(null);
    setPrayed(false);
    setCalendar(null);
    if (calendarRef.current) calendarRef.current.open = false;
    setMessage('Example reset. Nothing was saved or sent.');
  }

  function chooseCalendar(choice: string) {
    setCalendar(choice);
    setMessage(`Preview choice: ${choice}. Your real calendar has not changed.`);
  }

  return (
    <Surface
      as="div"
      tone="accent"
      pad="md"
      data-dashboard-preview
      role="region"
      aria-label="FaithFlow illustrative dashboard"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="font-body text-meta font-medium uppercase tracking-[0.14em] text-gold-lt">
          Illustrative preview
        </p>
        <Button fx={false} variant="quiet" size="sm" onClick={reset}>
          Reset example
        </Button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-silver">
        Sample details. Try the actions here; nothing is saved or sent.
      </p>

      <div className="mt-5 border-t border-border-sub pt-5">
        <p className="font-body text-meta uppercase tracking-[0.14em] text-silver">Next gathering</p>
        <h3 className="mt-2 font-display text-3xl font-light leading-tight text-ivory">
          Supper &amp; conversation
        </h3>
        <p className="mt-2 text-base text-ivory-dim">Thursday, 6:30 pm</p>
        <p className="text-sm text-silver">At a member’s home</p>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-ivory">Will you make it?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {ANSWERS.map((option) => (
              <Button
                key={option.value}
                fx={false}
                variant={answer === option.value ? 'primary' : 'quiet'}
                size="sm"
                aria-pressed={answer === option.value}
                className="px-2"
                onClick={() => {
                  setAnswer(option.value);
                  setMessage(`Preview answer: ${option.label}. No RSVP has been sent.`);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </fieldset>

        <details ref={calendarRef} className="mt-3">
          <summary className="min-h-11 cursor-pointer content-center rounded-sm py-2 text-sm font-medium text-gold-lt transition-colors duration-200 hover:text-ivory">
            Put it on my calendar
          </summary>
          <p className="mt-1 text-sm leading-relaxed text-silver">
            Members can open Google Calendar or download an event for Apple or Outlook.
            These example buttons only show your choice.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Google Calendar', 'Apple or Outlook'].map((choice) => (
              <Button
                key={choice}
                fx={false}
                variant={calendar === choice ? 'ghost' : 'quiet'}
                size="sm"
                aria-pressed={calendar === choice}
                onClick={() => chooseCalendar(choice)}
              >
                {choice}
              </Button>
            ))}
          </div>
        </details>
      </div>

      <div className="mt-5 border-t border-border-sub pt-5">
        <h3 className="text-base font-medium text-ivory">Prayer wall</h3>
        <p className="mt-3 font-body text-meta text-silver">Alex · sample request</p>
        <p className="mt-1 text-base text-ivory">Peace for a busy week</p>
        <p className="mt-1 text-sm leading-relaxed text-ivory-dim">
          Please pray for patience and space to listen well.
        </p>
        <Button
          fx={false}
          variant={prayed ? 'ghost' : 'quiet'}
          size="sm"
          className="mt-4"
          aria-pressed={prayed}
          aria-disabled={prayed || undefined}
          onClick={() => {
            if (prayed) return;
            setPrayed(true);
            setMessage('Preview response: praying with Alex. No prayer response or notification has been sent.');
          }}
        >
          {prayed ? 'Praying with you' : 'Pray with them'}
        </Button>
      </div>

      <Notice tone="info" message={message} className="mt-4 min-h-14" />

      {/* Retain both existing quotations exactly. No memory game, source
          attribution, or context claim is introduced while review is gated. */}
      <details className="border-t border-border-sub pt-2">
        <summary className="min-h-11 cursor-pointer content-center rounded-sm py-2 text-sm text-ivory-dim transition-colors duration-200 hover:text-ivory">
          Scripture in this example
        </summary>
        <div className="space-y-5 pb-2 pt-3">
          <figure>
            <blockquote className="font-display text-xl leading-relaxed text-ivory">
              &ldquo;They are new every morning. Great is your faithfulness.&rdquo;
            </blockquote>
            <figcaption className="mt-1 font-body text-meta text-gold-lt">Lamentations 3:23</figcaption>
          </figure>
          <figure>
            <blockquote className="font-display text-xl leading-relaxed text-ivory">
              &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
            </blockquote>
            <figcaption className="mt-1 font-body text-meta text-gold-lt">Proverbs 27:17</figcaption>
          </figure>
        </div>
      </details>
    </Surface>
  );
}
