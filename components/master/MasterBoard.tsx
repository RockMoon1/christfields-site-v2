'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import type { MasterGroupOverview } from '@/app/dashboard/(master)/master/actions';
import { getMemberForMaster } from '@/app/dashboard/(master)/master/actions';
import type { LeaderActivity } from '@/lib/faithflow/master-access';
import type { MemberDetail, MemberSummary, GuidanceCard, Trend } from '@/lib/faithflow/types';
import { bibleUrl } from '@/lib/faithflow/guidance';
import { removeMemberVerse, resetMemberVerse } from '@/lib/faithflow/shepherd-actions';

/* ============================================================
   Props
   ============================================================ */

interface MasterBoardProps {
  groups: MasterGroupOverview[];
  totals: {
    groups: number;
    leaders: number;
    members: number;
    activeThisWeek: number;
    needsAttention: number;
  };
  guidance: GuidanceCard[];
}

/* ============================================================
   Motion helpers
   ============================================================ */

const EASE = [0.22, 1, 0.36, 1] as const;

function fadeUp(index: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.55,
      delay: 0.08 + index * 0.06,
      ease: EASE,
    },
  };
}

/* ============================================================
   Timestamp helper. Clerk timestamps are unix MILLISECONDS.
   ============================================================ */

function humanizeMs(ms: number | null): string {
  if (ms === null) return 'No sign-in yet';
  const now = Date.now();
  const diffDays = Math.floor((now - ms) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 8) return `${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} months ago`;
}

function isEngaged(lastActiveAt: number | null): boolean {
  if (lastActiveAt === null) return false;
  return Date.now() - lastActiveAt < 7 * 24 * 60 * 60 * 1000;
}

/* ============================================================
   Trend arrow inline SVG
   ============================================================ */

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'none' || trend === 'steady') {
    return <span className="ml-1 text-[10px] text-silver">steady</span>;
  }
  if (trend === 'up') {
    return (
      <svg viewBox="0 0 12 12" fill="none" className="ml-1 inline-block h-3 w-3 text-emerald-lt" aria-label="up">
        <path d="M2 9 L6 3 L10 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 12 12" fill="none" className="ml-1 inline-block h-3 w-3 text-gold" aria-label="down">
      <path d="M2 3 L6 9 L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================
   Vitality ring (circular SVG, 0-10 scale) reused from GroupOverview
   ============================================================ */

function VitalityRing({ value, size = 56 }: { value: number; size?: number }) {
  const r = size * 0.39;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / 10, 1) * circ;
  const cx = size / 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} aria-hidden>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle
        cx={cx} cy={cx} r={r} fill="none" stroke="#c9a548" strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${dash.toFixed(2)} ${circ.toFixed(2)}`}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <text
        x={cx} y={cx + 5} textAnchor="middle"
        fill="#e4c97a" fontSize={13}
        fontFamily="var(--font-display)" fontWeight={300}
      >
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

/* ============================================================
   Mood sparkline for member detail (mood array values 1-5)
   ============================================================ */

function MoodSparkline({ entries }: { entries: { date: string; mood: number }[] }) {
  if (entries.length < 2) {
    return <p className="text-xs italic text-muted">Not enough mood data yet.</p>;
  }
  const w = 260;
  const h = 44;
  const padX = 4;
  const padY = 5;
  const min = 1;
  const max = 5;
  const n = entries.length;

  const yFor = (v: number) =>
    h - padY - ((v - min) / (max - min)) * (h - padY * 2);

  const pts = entries.map((e, i) => {
    const x = padX + (i / (n - 1)) * (w - padX * 2);
    return `${x.toFixed(1)},${yFor(e.mood).toFixed(1)}`;
  });

  const last = entries[entries.length - 1];
  const lastX = padX + (w - padX * 2);
  const lastY = yFor(last.mood);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full" preserveAspectRatio="none" aria-hidden>
      <polygon
        points={`${padX},${h - padY} ${pts.join(' ')} ${w - padX},${h - padY}`}
        fill="url(#moodFill)" opacity={0.22}
      />
      <polyline
        points={pts.join(' ')} fill="none"
        stroke="#c9a548" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill="#e4c97a" />
      <defs>
        <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a548" />
          <stop offset="100%" stopColor="#c9a548" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ============================================================
   Master guidance section: leading the leaders this season.
   Same warm GuidanceCard shape the leader view uses, one tier up.
   ============================================================ */

function MasterGuidanceSection({ cards }: { cards: GuidanceCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section aria-label="Leading the leaders this season" className="mb-12">
      <motion.p
        {...fadeUp(0)}
        className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted"
      >
        Leading the leaders this season
      </motion.p>
      <motion.p {...fadeUp(1)} className="mb-6 text-sm text-silver">
        These are prayerful starting points drawn from what the data is showing across your groups.
        They are not scripts. Bring them to prayer first, then to your leaders.
      </motion.p>
      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((card, i) => (
          <motion.article
            key={i}
            {...fadeUp(2 + i)}
            className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6"
          >
            <motion.div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
              animate={{ opacity: [0.25, 0.65, 0.25] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />

            <p className="mb-4 text-sm leading-relaxed text-ivory-dim">{card.signal}</p>

            {card.scriptures.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                  Scripture
                </p>
                <ul className="flex flex-col gap-2">
                  {card.scriptures.map((s, j) => (
                    <li key={j} className="flex flex-col gap-0.5">
                      <a
                        href={bibleUrl(s.ref)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gold-lt hover:underline"
                      >
                        {s.ref}&#8599;
                      </a>
                      <span className="text-xs text-silver">{s.why}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {card.studyIdeas.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                  Study ideas
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.studyIdeas.map((idea, j) => (
                    <span
                      key={j}
                      className="rounded-sm border border-border-sub bg-black-4 px-2.5 py-1 text-xs text-ivory-dim"
                    >
                      {idea}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {card.leaderActions.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                  For you, leading the leaders
                </p>
                <ul className="flex flex-col gap-2">
                  {card.leaderActions.map((action, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-silver">
                      <span className="mt-0.5 h-4 w-4 shrink-0">
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                          <rect x={2} y={2} width={12} height={12} rx={2} stroke="rgba(201,165,72,0.4)" strokeWidth={1} />
                        </svg>
                      </span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   Instance totals row
   ============================================================ */

function TotalsRow({ totals }: { totals: MasterBoardProps['totals'] }) {
  const items = [
    { label: 'Groups', value: totals.groups, hint: 'Active FaithFlow groups' },
    { label: 'Leaders', value: totals.leaders, hint: 'Org admins across all groups' },
    { label: 'Members', value: totals.members, hint: 'Total enrolled members' },
    { label: 'Active this week', value: totals.activeThisWeek, hint: 'Logged something in the last 7 days' },
    { label: 'Needs attention', value: totals.needsAttention, hint: 'Members flagged for a gentle check-in', accent: totals.needsAttention > 0 ? '#c9a548' : '#2d6a4f' },
  ];

  return (
    <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item, i) => {
        const accent = item.accent ?? '#c9a548';
        return (
          <motion.div
            key={item.label}
            {...fadeUp(i)}
            className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-5"
          >
            <motion.div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(to right, transparent, ${accent}88, transparent)` }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.45 }}
            />
            <motion.span
              aria-hidden
              className="absolute right-3 top-3 inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: accent }}
              animate={{ opacity: [0.4, 1, 0.4], boxShadow: [`0 0 0px ${accent}`, `0 0 8px ${accent}`, `0 0 0px ${accent}`] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            />
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
              {item.label}
            </p>
            <p className="font-display text-4xl font-light leading-none text-gold-lt">
              {item.value}
            </p>
            <p className="mt-2 text-xs text-silver">{item.hint}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Leader accountability row
   ============================================================ */

function LeaderRow({ leader }: { leader: LeaderActivity }) {
  const engaged = isEngaged(leader.lastActiveAt);
  const signInLabel = leader.lastSignInAt === null
    ? 'No sign-in yet'
    : `Signed in ${humanizeMs(leader.lastSignInAt)}`;
  const activeLabel = leader.lastActiveAt === null
    ? 'No activity recorded'
    : `Active ${humanizeMs(leader.lastActiveAt)}`;

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      {leader.imageUrl ? (
        <img
          src={leader.imageUrl}
          alt={leader.name}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border-gold"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-[13px] font-medium text-black">
          {leader.name.trim().charAt(0).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ivory">{leader.name}</span>
          <span
            className={
              'rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ' +
              (engaged
                ? 'border-emerald-lt/30 text-emerald-lt'
                : 'border-gold/30 text-gold')
            }
          >
            {engaged ? 'engaged' : 'quiet'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-silver">
          {signInLabel}. {activeLabel}.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Compact member row (summary list inside an expanded group)
   ============================================================ */

function MemberRow({
  member,
  onDrill,
}: {
  member: MemberSummary;
  onDrill: (userId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onDrill(member.userId)}
      className="group flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors hover:bg-black-4"
    >
      {/* Attention dot */}
      <span
        className={'h-1.5 w-1.5 shrink-0 rounded-full ' + (member.attention ? 'bg-gold' : 'bg-emerald-lt opacity-50')}
        aria-label={member.attention ? 'needs attention' : 'steady'}
      />

      {/* Name */}
      <span className="w-36 shrink-0 truncate text-sm text-ivory-dim group-hover:text-ivory">
        {member.name}
      </span>

      {/* Vitality bar */}
      <div className="relative h-1 w-20 shrink-0 overflow-hidden rounded-full bg-black-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gold"
          style={{ width: `${Math.min((member.vitality / 10) * 100, 100)}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted">
        {member.vitality.toFixed(1)}
      </span>

      {/* Mood trend */}
      {member.moodAvg !== null ? (
        <span className="flex items-center gap-0.5 text-xs text-silver">
          {member.moodAvg.toFixed(1)}
          <TrendArrow trend={member.moodTrend} />
        </span>
      ) : (
        <span className="text-xs text-muted">no mood</span>
      )}

      {/* Consistency */}
      <span className="ml-auto shrink-0 text-xs tabular-nums text-muted">
        {member.rhythmConsistency}% rhythm
      </span>

      {/* Last active */}
      <span className="w-24 shrink-0 text-right text-xs text-muted">
        {member.daysSinceActive !== null ? `${member.daysSinceActive}d ago` : 'no activity'}
      </span>

      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ============================================================
   Member detail panel
   ============================================================ */

function MemberPanel({
  detail,
  onClose,
}: {
  detail: MemberDetail | null | 'loading' | 'not-found';
  onClose: () => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.38, ease: EASE }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-border-sub bg-black-2 shadow-2xl"
      aria-label="Member detail"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border-sub px-6 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Member detail
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-silver transition-colors hover:text-ivory"
          aria-label="Close panel"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-6 py-6">
        {detail === 'loading' && (
          <div className="flex flex-col items-center gap-4 pt-16 text-center">
            <motion.div
              className="h-8 w-8 rounded-full border-2 border-border-sub border-t-gold"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm text-silver">Loading member data.</p>
          </div>
        )}

        {detail === 'not-found' && (
          <div className="pt-16 text-center">
            <p className="text-sm text-silver">
              This member's data could not be loaded right now. They may have
              left the group, or there may be a temporary issue.
            </p>
          </div>
        )}

        {detail !== null && detail !== 'loading' && detail !== 'not-found' && (
          <MemberDetailView detail={detail} />
        )}
      </div>
    </motion.aside>
  );
}

/* ============================================================
   Member detail view (rendered inside the panel)
   ============================================================ */

function MemberDetailView({ detail }: { detail: MemberDetail }) {
  // Local optimistic copy of verses so remove/reset update instantly.
  const [verses, setVerses] = useState(detail.verses ?? []);

  async function handleReset(verseId: string) {
    const prev = verses;
    setVerses((v) => v.map((x) => x.id === verseId ? { ...x, status: 'learning' as const } : x));
    const res = await resetMemberVerse(detail.userId, verseId);
    if (!res.ok) setVerses(prev);
  }

  async function handleRemove(verseId: string) {
    const prev = verses;
    setVerses((v) => v.filter((x) => x.id !== verseId));
    const res = await removeMemberVerse(detail.userId, verseId);
    if (!res.ok) setVerses(prev);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Identity */}
      <div className="flex items-center gap-3">
        {detail.imageUrl ? (
          <img
            src={detail.imageUrl}
            alt={detail.name}
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border-gold"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-base font-medium text-black">
            {detail.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="font-display text-xl font-light text-ivory">{detail.name}</p>
          {detail.attention && detail.attentionReasons.length > 0 && (
            <p className="mt-0.5 text-xs text-silver">{detail.attentionReasons.join('. ')}.</p>
          )}
        </div>
      </div>

      {/* Areas */}
      {detail.areas.length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Spiritual areas
          </p>
          <div className="flex flex-col gap-2">
            {detail.areas
              .slice()
              .sort((a, b) => (b.latest ?? 0) - (a.latest ?? 0))
              .map((area) => {
                const pct = Math.min(((area.latest ?? 0) / 10) * 100, 100);
                return (
                  <div key={area.presetKey ?? area.name} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs text-silver">{area.name}</span>
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black-4">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
                        style={{ width: `${pct}%`, backgroundColor: area.color }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right text-xs tabular-nums text-ivory-dim">
                      {area.latest !== null ? area.latest.toFixed(1) : '--'}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Mood sparkline */}
      {detail.mood.length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Mood over time (1-5)
          </p>
          <MoodSparkline entries={detail.mood} />
        </section>
      )}

      {/* Rhythms */}
      {detail.rhythms.length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Daily rhythms this week
          </p>
          <div className="flex flex-col gap-2">
            {detail.rhythms.map((r) => {
              const pct = r.target > 0 ? Math.min((r.weekDone / r.target) * 100, 100) : 0;
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-silver">{r.name}</span>
                  <div className="relative h-1 w-20 shrink-0 overflow-hidden rounded-full bg-black-4">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
                      style={{ width: `${pct}%`, backgroundColor: r.color }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted">
                    {r.weekDone}/{r.target}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Prayer and memory counts */}
      <section>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Prayer and scripture
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-sm border border-border-sub bg-black-3 p-4">
            <p className="text-2xl font-light text-gold-lt font-display">{detail.prayer.open}</p>
            <p className="mt-1 text-xs text-silver">open prayers</p>
          </div>
          <div className="rounded-sm border border-border-sub bg-black-3 p-4">
            <p className="text-2xl font-light text-gold-lt font-display">{detail.prayer.answered}</p>
            <p className="mt-1 text-xs text-silver">answered prayers</p>
          </div>
          <div className="rounded-sm border border-border-sub bg-black-3 p-4">
            <p className="text-2xl font-light text-gold-lt font-display">{detail.memory.learning}</p>
            <p className="mt-1 text-xs text-silver">verses learning</p>
          </div>
          <div className="rounded-sm border border-border-sub bg-black-3 p-4">
            <p className="text-2xl font-light text-gold-lt font-display">{detail.memory.memorized}</p>
            <p className="mt-1 text-xs text-silver">verses memorized</p>
          </div>
        </div>
      </section>

      {/* Shared prayers */}
      {detail.prayer.shared.length > 0 && (
        <section>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Shared prayers
          </p>
          <p className="mb-3 text-[10px] text-muted italic">
            This member chose to share these with their group.
          </p>
          <div className="flex flex-col gap-2">
            {detail.prayer.shared.map((p, i) => (
              <div
                key={i}
                className="rounded-sm border border-border-sub bg-black-3 p-4"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-ivory-dim">{p.title}</p>
                  {p.answered && (
                    <span className="text-[9px] uppercase tracking-[0.16em] text-emerald-lt">
                      answered
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-silver">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Scripture memory */}
      <section>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Scripture memory
        </p>
        <p className="mb-3 text-xs text-silver">
          You can test them on these. Clear a verse they are not ready on, or send it back to learning.
        </p>
        {verses.length === 0 ? (
          <p className="text-sm italic text-muted">No verses yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {verses.map((v) => (
              <div
                key={v.id}
                className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-4 pl-5"
              >
                <div className="absolute inset-y-0 left-0 w-0.5 bg-gold/40" />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={bibleUrl(v.reference)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gold-lt transition-colors hover:text-gold hover:underline"
                    >
                      {v.reference} &#8599;
                    </a>
                    <p className="mt-1 text-xs italic leading-relaxed text-silver">{v.text}</p>
                    <p className="mt-1 text-[10px] text-muted">reviewed {v.reviews} {v.reviews === 1 ? 'time' : 'times'}</p>
                  </div>
                  <span
                    className={
                      'shrink-0 rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] ' +
                      (v.status === 'memorized'
                        ? 'border-emerald-lt/30 bg-emerald-lt/10 text-emerald-lt'
                        : 'border-gold/30 bg-gold/[0.06] text-gold-lt')
                    }
                  >
                    {v.status === 'memorized' ? 'Memorized' : 'Learning'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReset(v.id)}
                    className="rounded-sm border border-border-sub px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-silver transition-colors hover:border-border-gold hover:text-ivory"
                  >
                    Send back to learning
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(v.id)}
                    className="rounded-sm border border-border-sub px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-silver transition-colors hover:border-red-400/50 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shared with the community */}
      <section>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
          Shared with the community
        </p>
        <p className="mb-3 text-xs text-silver">
          These were posted to the community wall by {detail.name.split(' ')[0]}.
        </p>
        {(detail.community ?? []).length === 0 ? (
          <p className="text-sm italic text-muted">Nothing shared to the wall yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(detail.community ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-sm border border-border-sub bg-black-3 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ivory-dim">{item.title}</p>
                  {item.answered && (
                    <span className="shrink-0 rounded-sm border border-emerald-lt/30 bg-emerald-lt/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-emerald-lt">
                      Answered
                    </span>
                  )}
                </div>
                {item.body && (
                  <p className="mt-1.5 text-xs leading-relaxed text-silver">{item.body}</p>
                )}
                <p className="mt-2 text-[10px] text-muted">{item.prayCount} {item.prayCount === 1 ? 'person' : 'people'} praying</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Guidance cards */}
      {detail.guidance.length > 0 && (
        <section>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Prayerful starting points
          </p>
          <p className="mb-3 text-[10px] text-muted italic">
            Drawn from this member's area data. Use as prompts, not prescriptions.
          </p>
          <div className="flex flex-col gap-4">
            {detail.guidance.map((card: GuidanceCard, i: number) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-5"
              >
                <p className="mb-3 text-xs leading-relaxed text-ivory-dim">{card.signal}</p>
                {card.scriptures.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1.5">
                    {card.scriptures.map((s, j) => (
                      <li key={j}>
                        <a
                          href={bibleUrl(s.ref)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-gold-lt hover:underline"
                        >
                          {s.ref}&#8599;
                        </a>
                        <span className="ml-1.5 text-xs text-silver">{s.why}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {card.leaderActions.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {card.leaderActions.map((action, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-silver">
                        <span className="mt-0.5 h-3 w-3 shrink-0 text-gold opacity-60">+</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ============================================================
   Group card
   ============================================================ */

function GroupCard({
  group,
  index,
  onDrill,
}: {
  group: MasterGroupOverview;
  index: number;
  onDrill: (userId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const attentionCount = group.members.filter((m) => m.attention).length;
  const participation = group.memberCount > 0
    ? Math.round((group.group.activeThisWeek / group.memberCount) * 100)
    : 0;

  return (
    <motion.article
      {...fadeUp(index)}
      layout
      className="overflow-hidden rounded-sm border border-border-sub bg-black-3"
    >
      {/* Top accent shimmer */}
      <motion.div
        aria-hidden
        className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      />

      <div className="p-6">
        {/* Group name + counts */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-light text-ivory">{group.orgName}</h2>
            <p className="mt-0.5 text-xs text-silver">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
              {attentionCount > 0 && (
                <span className="ml-2 text-gold">
                  {attentionCount} need{attentionCount === 1 ? 's' : ''} attention
                </span>
              )}
            </p>
          </div>

          {/* Quick health numbers */}
          <div className="flex items-center gap-4">
            <VitalityRing value={parseFloat(group.group.avgVitality.toFixed(1))} size={52} />
            <div className="text-right">
              {group.group.moodAvg !== null ? (
                <p className="font-display text-xl font-light text-gold-lt">
                  {group.group.moodAvg.toFixed(1)}
                  <TrendArrow trend={group.group.moodTrend} />
                </p>
              ) : (
                <p className="text-xs text-muted">no mood</p>
              )}
              <p className="text-xs text-silver">{participation}% active</p>
            </div>
          </div>
        </div>

        {/* Leader accountability (the heart of the page) */}
        {group.leaders.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
              Leader accountability
            </p>
            <div className="flex flex-col gap-4 rounded-sm border border-border-sub bg-black-4 p-4">
              {group.leaders.map((leader) => (
                <LeaderRow key={leader.userId} leader={leader} />
              ))}
              {group.leaders.length === 0 && (
                <p className="text-xs text-silver">No leaders assigned to this group yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Struggling areas */}
        {group.group.strugglingAreas.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
              Areas that may need prayer
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.group.strugglingAreas.map((area) => (
                <span
                  key={area.presetKey ?? area.name}
                  className="rounded-sm border border-gold/25 bg-black-4 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-gold"
                >
                  {area.name} {area.avg.toFixed(1)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Controls row: expand members + full group view link */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {group.members.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-silver transition-colors hover:text-ivory"
            >
              <motion.svg
                viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5"
                animate={{ rotate: expanded ? 90 : 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              {expanded ? 'Hide members' : `See all ${group.memberCount} members`}
            </button>
          )}
          <Link
            href={`/dashboard/master/group/${group.orgId}`}
            className="flex items-center gap-1.5 rounded-sm border border-border-gold px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-gold-lt transition-colors hover:bg-gold/10"
          >
            Open full group view
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Expanded member list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-sub">
              {/* Column headers */}
              <div className="flex items-center gap-3 border-b border-border-sub px-3 py-2">
                <span className="w-1.5 shrink-0" />
                <span className="w-36 shrink-0 text-[9px] uppercase tracking-[0.18em] text-muted">Name</span>
                <span className="w-20 shrink-0 text-[9px] uppercase tracking-[0.18em] text-muted">Vitality</span>
                <span className="w-6 shrink-0" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-muted">Mood</span>
                <span className="ml-auto w-24 shrink-0 text-right text-[9px] uppercase tracking-[0.18em] text-muted">Last active</span>
                <span className="w-3.5 shrink-0" />
              </div>
              {group.members.map((member) => (
                <MemberRow key={member.userId} member={member} onDrill={onDrill} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ============================================================
   Main MasterBoard component
   ============================================================ */

export function MasterBoard({ groups, totals, guidance }: MasterBoardProps) {
  const [panelDetail, setPanelDetail] = useState<MemberDetail | null | 'loading' | 'not-found'>(null);
  const [isPending, startTransition] = useTransition();

  function drillInto(userId: string) {
    setPanelDetail('loading');
    startTransition(async () => {
      const detail = await getMemberForMaster(userId);
      setPanelDetail(detail ?? 'not-found');
    });
  }

  function closePanel() {
    setPanelDetail(null);
  }

  return (
    <>
      {/* Instance totals */}
      <TotalsRow totals={totals} />

      {/* Master guidance: leading the leaders */}
      <MasterGuidanceSection cards={guidance} />

      {/* Groups */}
      <section aria-label="All groups">
        <motion.p
          {...fadeUp(5)}
          className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted"
        >
          All groups
        </motion.p>
        <motion.p
          {...fadeUp(6)}
          className="mb-6 text-sm text-silver"
        >
          Click any member row to open their detail. Leader activity reflects
          their Clerk sign-in and session timestamps.
        </motion.p>

        <div className="flex flex-col gap-6">
          {groups.map((group, i) => (
            <GroupCard
              key={group.orgId}
              group={group}
              index={7 + i}
              onDrill={drillInto}
            />
          ))}
        </div>
      </section>

      {/* Member detail panel */}
      <AnimatePresence>
        {panelDetail !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closePanel}
              aria-hidden
            />
            <MemberPanel
              detail={panelDetail}
              onClose={closePanel}
            />
          </>
        )}
      </AnimatePresence>

      {/* Visually hidden loading indicator for screen readers */}
      {isPending && (
        <span className="sr-only" aria-live="polite">Loading member detail.</span>
      )}
    </>
  );
}
