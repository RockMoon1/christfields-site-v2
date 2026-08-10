'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A small, clickable preview of the real member dashboard. It mirrors the
 * actual tabs (Today, Prayer, Reflect, Scripture from nav-data.tsx) so a
 * visitor gets an honest feel for the product, but every interaction is
 * local state only: nothing is tracked, stored, or sent anywhere. The daily
 * verse uses exact WEB wording (the repo's verified source); Proverbs 27:17
 * keeps the site-wide brand rendering used in every hero and card.
 */

type TabKey = 'today' | 'prayer' | 'reflect' | 'scripture';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'prayer', label: 'Prayer' },
  { key: 'reflect', label: 'Reflect' },
  { key: 'scripture', label: 'Scripture' },
];

const RHYTHMS = [
  { name: 'Read Scripture', color: '#e4c97a' },
  { name: 'Pray', color: '#c9a548' },
  { name: 'Gratitude', color: '#52b788' },
  { name: 'Examen', color: '#7e6ba8' },
];

const MOODS = ['Heavy', 'Low', 'Okay', 'Good', 'Full'];

export function DashboardPreview() {
  const [tab, setTab] = useState<TabKey>('today');
  const [kept, setKept] = useState([true, true, true, false]);
  const [answered, setAnswered] = useState([false, false]);
  const [mood, setMood] = useState<number | null>(null);
  const [verseHidden, setVerseHidden] = useState(false);

  const keptCount = kept.filter(Boolean).length;

  return (
    <div className="relative rounded-md border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6 shadow-2xl">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
      />

      {/* Header: matches the calm register of the real dashboard chrome. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          The Dashboard
        </p>
        {tab === 'today' && (
          <p className="text-xs text-silver">
            {keptCount} of {RHYTHMS.length} kept
          </p>
        )}
      </div>

      {/* Tab row: the real product's tabs, clickable. */}
      <div role="tablist" aria-label="Dashboard preview tabs" className="mb-5 flex gap-1 border-b border-border-sub">
        {TABS.map((t) => (
          <button
            key={t.key}
            id={`preview-tab-${t.key}`}
            role="tab"
            aria-selected={tab === t.key}
            aria-controls="preview-panel"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-t-sm px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors',
              tab === t.key
                ? 'border-b border-gold text-gold-lt'
                : 'text-muted hover:text-ivory-dim',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="preview-panel" aria-labelledby={`preview-tab-${tab}`} className="min-h-[236px]">
        {tab === 'today' && (
          <div className="space-y-2.5">
            {RHYTHMS.map((r, i) => (
              <button
                key={r.name}
                aria-pressed={kept[i]}
                onClick={() =>
                  setKept((prev) => prev.map((v, j) => (j === i ? !v : v)))
                }
                className="flex w-full items-center gap-3 rounded-sm border border-border-sub bg-black-2/70 px-3 py-2.5 text-left transition-colors hover:border-border-gold"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
                  style={{
                    backgroundColor: kept[i] ? r.color : 'transparent',
                    border: kept[i] ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {kept[i] && (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-black">
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className={kept[i] ? 'text-sm text-ivory-dim' : 'text-sm text-ivory'}>
                  {r.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === 'prayer' && (
          <div className="space-y-2.5">
            {[
              { text: "A friend's interview on Friday" },
              { text: 'Patience with the season I am in' },
            ].map((p, i) => (
              <button
                key={p.text}
                aria-pressed={answered[i]}
                onClick={() =>
                  setAnswered((prev) => prev.map((v, j) => (j === i ? !v : v)))
                }
                className="flex w-full items-center justify-between gap-3 rounded-sm border border-border-sub bg-black-2/70 px-3 py-3 text-left transition-colors hover:border-border-gold"
              >
                <span className="text-sm text-ivory">{p.text}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors',
                    answered[i]
                      ? 'border-emerald-lt/40 bg-emerald-lt/15 text-emerald-bright'
                      : 'border-gold/25 bg-gold/10 text-gold',
                  )}
                >
                  {answered[i] ? 'Answered' : 'Praying'}
                </span>
              </button>
            ))}
            <p className="pt-1 text-xs text-muted">Between you and him. Tap a prayer to mark it answered.</p>
          </div>
        )}

        {tab === 'reflect' && (
          <div>
            <p className="mb-3 text-sm text-ivory">How are you, honestly?</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {MOODS.map((m, i) => (
                <button
                  key={m}
                  aria-pressed={mood === i}
                  onClick={() => setMood(mood === i ? null : i)}
                  className={cn(
                    'rounded-sm border px-3 py-2 text-xs tracking-wider transition-colors',
                    mood === i
                      ? 'border-gold bg-gold/15 text-gold-lt'
                      : 'border-border-sub bg-black-2/70 text-ivory-dim hover:border-border-gold',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="rounded-sm border border-border-sub bg-black-2/70 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-silver">Tonight</p>
              <p className="mt-1 text-sm text-ivory-dim">
                Three things you are thankful for, and a gentle look back over the day with God.
              </p>
            </div>
          </div>
        )}

        {tab === 'scripture' && (
          <div>
            <div className="rounded-sm border border-border-sub bg-black-2/70 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-silver">Verse of the day</p>
              <p className="mt-2 font-display text-base italic leading-relaxed text-ivory">
                &ldquo;They are new every morning. Great is your faithfulness.&rdquo;
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gold-lt">
                Lamentations 3:23
              </p>
            </div>
            <button
              onClick={() => setVerseHidden((v) => !v)}
              className="mt-3 w-full rounded-sm border border-border-sub bg-black-2/70 px-4 py-3 text-left transition-colors hover:border-border-gold"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-silver">
                Memory verse · tap to {verseHidden ? 'reveal' : 'hide'}
              </p>
              <p
                className={cn(
                  'mt-2 font-display text-base italic leading-relaxed transition-all',
                  verseHidden ? 'text-transparent [text-shadow:0_0_10px_rgba(240,236,227,0.55)]' : 'text-ivory',
                )}
              >
                &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gold-lt">
                Proverbs 27:17
              </p>
            </button>
          </div>
        )}
      </div>

      <p className="mt-5 border-t border-border-sub pt-3 text-[11px] text-muted">
        A small preview to click around. Nothing here is tracked or saved.
      </p>
    </div>
  );
}
