'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getMemberDetail } from '@/app/dashboard/(leader)/leader/actions';
import type { MemberSummary, MemberDetail, AreaStatus, GuidanceCard, Trend } from '@/lib/faithflow/types';
import { bibleUrl } from '@/lib/faithflow/guidance';
import { removeMemberVerse, resetMemberVerse } from '@/lib/faithflow/shepherd-actions';

/* ============================================================
   Props
   ============================================================ */

interface MembersBoardProps {
  members: MemberSummary[];
}

/* ============================================================
   Board root
   ============================================================ */

export function MembersBoard({ members }: MembersBoardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    members.length > 0 ? members[0].userId : null,
  );
  const [detail, setDetail] = useState<MemberDetail | null | 'error'>(null);
  const [loading, setLoading] = useState(false);

  // Load the selected member's detail whenever the selection changes. This MUST
  // live in an effect, never during render: kicking off a state update during
  // render causes an update-in-render loop that crashes the page.
  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    getMemberDetail(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d ?? 'error');
      })
      .catch(() => {
        if (!cancelled) setDetail('error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function selectMember(userId: string) {
    if (userId === selectedId) return;
    setSelectedId(userId);
  }

  const selected = members.find((m) => m.userId === selectedId) ?? null;

  if (members.length === 0) {
    return (
      <p className="mt-8 text-sm text-silver">No members to show.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Left: member list */}
      <div className="w-full shrink-0 lg:w-72 xl:w-80">
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <MemberCard
              key={m.userId}
              member={m}
              isSelected={m.userId === selectedId}
              onSelect={() => selectMember(m.userId)}
            />
          ))}
        </ul>
      </div>

      {/* Right: drill-down */}
      <div className="min-w-0 flex-1">
        {selectedId === null ? (
          <div className="flex h-48 items-center justify-center rounded-sm border border-border-sub bg-black-3">
            <p className="text-sm text-muted">Select a member to see their journey.</p>
          </div>
        ) : loading ? (
          <LoadingPanel name={selected?.name} />
        ) : detail === 'error' ? (
          <div className="flex h-48 items-center justify-center rounded-sm border border-border-sub bg-black-3">
            <p className="text-sm text-silver">
              Could not load this member right now. Try again in a moment.
            </p>
          </div>
        ) : detail ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={detail.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <MemberDrilldown detail={detail} />
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
   Member list card
   ============================================================ */

function MemberCard({
  member,
  isSelected,
  onSelect,
}: {
  member: MemberSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const lastActiveLabel = formatLastActive(member.daysSinceActive);

  return (
    <motion.li layout transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'group relative w-full rounded-sm border bg-black-3 p-3 text-left transition-colors',
          isSelected
            ? 'border-border-gold bg-black-4'
            : 'border-border-sub hover:border-border-gold hover:bg-black-4',
        )}
      >
        {/* Selected gold strip */}
        {isSelected && (
          <motion.div
            layoutId="member-selected-stripe"
            className="absolute inset-y-0 left-0 w-0.5 rounded-l-sm bg-gold"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}

        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar imageUrl={member.imageUrl} initials={initials} size="sm" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className={cn(
                  'truncate text-sm font-medium',
                  isSelected ? 'text-ivory' : 'text-ivory-dim group-hover:text-ivory',
                )}
              >
                {member.name}
              </p>
              {member.isLeader && (
                <span className="rounded-sm border border-gold/30 px-1 py-0.5 text-[8px] uppercase tracking-[0.14em] text-gold">
                  Leader
                </span>
              )}
              {member.attention && (
                <span
                  aria-label="Needs attention"
                  className="ml-auto inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  style={{ boxShadow: '0 0 5px #c9a548' }}
                />
              )}
            </div>
            <div className="mt-1 flex items-center gap-3">
              {/* Vitality bar */}
              <VitalityBar value={member.vitality} />
              {/* Mood trend */}
              <TrendArrow trend={member.moodTrend} />
              <span className="text-[10px] text-muted">{lastActiveLabel}</span>
            </div>
          </div>
        </div>

        {/* Rhythm consistency */}
        <div className="mt-2 flex items-center gap-2 pl-10">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-black-2">
            <div
              className="h-full rounded-full bg-gold/50 transition-all"
              style={{ width: `${Math.min(100, member.rhythmConsistency)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted">{member.rhythmConsistency}%</span>
        </div>
      </button>
    </motion.li>
  );
}

/* ============================================================
   Loading panel
   ============================================================ */

function LoadingPanel({ name }: { name?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-sm border border-border-sub bg-black-3">
      <motion.div
        className="h-6 w-6 rounded-full border-2 border-border-sub border-t-gold"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-sm text-silver">
        {name ? `Loading ${name.split(' ')[0]}'s journey...` : 'Loading...'}
      </p>
    </div>
  );
}

/* ============================================================
   Drill-down panel
   ============================================================ */

function MemberDrilldown({ detail }: { detail: MemberDetail }) {
  const initials = detail.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const lastActiveLabel = formatLastActive(detail.daysSinceActive);

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
    <article className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4 rounded-sm border border-border-sub bg-black-3 p-5 pl-6">
        <Avatar imageUrl={detail.imageUrl} initials={initials} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-3xl font-light text-ivory">{detail.name}</h2>
            {detail.isLeader && (
              <span className="rounded-sm border border-gold/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">
                Leader
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">Last active: {lastActiveLabel}</p>
          {detail.attentionReasons.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {detail.attentionReasons.map((r) => (
                <li
                  key={r}
                  className="rounded-sm border border-gold/20 bg-gold/[0.06] px-2 py-0.5 text-[10px] text-gold-lt"
                >
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Areas */}
      {detail.areas.length > 0 && (
        <Section title="Areas">
          <div className="flex flex-col gap-2">
            {detail.areas.map((a) => (
              <AreaRow key={a.name} area={a} />
            ))}
          </div>
        </Section>
      )}

      {/* Rhythms */}
      {detail.rhythms.length > 0 && (
        <Section title="Rhythms">
          <div className="flex flex-col gap-2">
            {detail.rhythms.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-3 rounded-sm border border-border-sub bg-black-4 px-4 py-2.5"
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color, boxShadow: `0 0 5px ${r.color}88` }}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-ivory-dim">{r.name}</span>
                {r.doneToday && (
                  <span className="rounded-sm bg-emerald-lt/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-emerald-bright">
                    Done today
                  </span>
                )}
                <span className="shrink-0 text-xs text-silver">
                  {r.weekDone} of {r.target} this week
                </span>
                {r.streak > 0 && (
                  <span className="shrink-0 text-[10px] text-muted">{r.streak} day streak</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Mood sparkline */}
      {detail.mood.length > 1 && (
        <Section title="Mood">
          <div className="rounded-sm border border-border-sub bg-black-4 p-4">
            <MoodSparkline points={detail.mood} />
            <div className="mt-3 flex items-center gap-4">
              {detail.moodAvg !== null && (
                <p className="text-xs text-silver">
                  Average <span className="text-ivory">{detail.moodAvg.toFixed(1)}</span> / 5
                </p>
              )}
              <TrendArrow trend={detail.moodTrend} label />
            </div>
          </div>
        </Section>
      )}

      {/* Walk with God */}
      <Section title="Walk with God">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <WalkStat label="Open prayers" value={detail.prayer.open} />
          <WalkStat label="Answered prayers" value={detail.prayer.answered} accent="#2d6a4f" />
          <WalkStat label="Learning verses" value={detail.memory.learning} />
          <WalkStat label="Memorized" value={detail.memory.memorized} accent="#c9a548" />
        </div>

        {detail.prayer.shared.length > 0 && (
          <div className="mt-4">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
              Shared on the community wall
            </p>
            <p className="mb-3 text-[10px] text-muted/70 italic">
              These are the only prayers visible. {detail.name.split(' ')[0]} chose to share them.
            </p>
            <div className="flex flex-col gap-2">
              {detail.prayer.shared.map((p, i) => (
                <div
                  key={i}
                  className="rounded-sm border border-border-sub bg-black-4 p-4 pl-5 relative overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-0.5 bg-gold/40" />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ivory">{p.title}</p>
                    {p.answered && (
                      <span className="shrink-0 rounded-sm border border-emerald-lt/30 bg-emerald-lt/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-emerald-bright">
                        Answered
                      </span>
                    )}
                  </div>
                  {p.body && <p className="mt-1 text-xs leading-relaxed text-silver">{p.body}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Scripture memory */}
      <Section title="Scripture memory">
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
                className="relative overflow-hidden rounded-sm border border-border-sub bg-black-4 p-4 pl-5"
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
                    className={cn(
                      'shrink-0 rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]',
                      v.status === 'memorized'
                        ? 'border-emerald-lt/30 bg-emerald-lt/10 text-emerald-bright'
                        : 'border-gold/30 bg-gold/[0.06] text-gold-lt',
                    )}
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
      </Section>

      {/* Shared with the community */}
      <Section title="Shared with the community">
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
                className="rounded-sm border border-border-sub bg-black-4 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ivory">{item.title}</p>
                  {item.answered && (
                    <span className="shrink-0 rounded-sm border border-emerald-lt/30 bg-emerald-lt/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-emerald-bright">
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
      </Section>

      {/* Guidance */}
      {detail.guidance.length > 0 && (
        <Section title="Guidance for you, as leader">
          <p className="mb-4 text-xs text-muted italic">
            These are prayerful starting points, not conclusions. Read them with the Spirit, not a
            clipboard.
          </p>
          <div className="flex flex-col gap-4">
            {detail.guidance.map((g, i) => (
              <GuidanceCardView key={i} card={g} />
            ))}
          </div>
        </Section>
      )}
    </article>
  );
}

/* ============================================================
   Area row
   ============================================================ */

function AreaRow({ area }: { area: AreaStatus }) {
  const pct = area.latest !== null ? (area.latest / 10) * 100 : 0;
  const tierLabel: Record<string, string> = {
    struggling: 'Struggling',
    growing: 'Growing',
    leading: 'Leading',
    none: '',
  };
  const tierColor: Record<string, string> = {
    struggling: 'text-red-400',
    growing: 'text-gold',
    leading: 'text-emerald-bright',
    none: 'text-muted',
  };

  return (
    <div className="group flex items-center gap-3 rounded-sm border border-border-sub bg-black-4 px-4 py-2.5">
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: area.color, boxShadow: `0 0 6px ${area.color}88` }}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-ivory-dim">{area.name}</span>

      {/* Mini bar */}
      <div className="h-1 w-20 overflow-hidden rounded-full bg-black-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: area.color }}
        />
      </div>

      <span className="w-8 text-right font-display text-base font-light text-gold-lt">
        {area.latest !== null ? area.latest : <span className="text-muted text-xs">--</span>}
      </span>
      <span className="hidden text-[10px] text-muted sm:inline">/ 10</span>

      {area.tier !== 'none' && (
        <span className={cn('hidden w-16 text-right text-[10px] sm:inline', tierColor[area.tier])}>
          {tierLabel[area.tier]}
        </span>
      )}

      {area.target !== null && (
        <span className="hidden text-[10px] text-muted sm:inline">
          Target {area.target}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   Mood sparkline (1-5 scale)
   ============================================================ */

function MoodSparkline({ points }: { points: { date: string; mood: number }[] }) {
  const w = 480;
  const h = 52;
  const padX = 4;
  const padY = 6;
  const min = 1;
  const max = 5;
  const n = points.length;

  const yFor = (v: number) =>
    h - padY - ((v - min) / (max - min)) * (h - padY * 2);

  const pts = points.map((p, i) => {
    const x = padX + (i / (n - 1)) * (w - padX * 2);
    return `${x.toFixed(1)},${yFor(p.mood).toFixed(1)}`;
  });

  const last = points[n - 1];
  const lastX = padX + (w - padX * 2);
  const lastY = yFor(last.mood);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-14 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon
        points={`${padX},${h - padY} ${pts.join(' ')} ${w - padX},${h - padY}`}
        fill="url(#moodFill)"
        opacity={0.22}
      />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="#c9a548"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={3} fill="#e4c97a" />
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
   Guidance card
   ============================================================ */

function GuidanceCardView({ card }: { card: GuidanceCard }) {
  return (
    <div className="rounded-sm border border-border-sub bg-black-3 p-5">
      {/* Signal */}
      <p className="mb-4 text-sm leading-relaxed text-ivory-dim">{card.signal}</p>

      {/* Scriptures */}
      {card.scriptures.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {card.scriptures.map((s) => (
            <div key={s.ref} className="border-l-2 border-gold/40 pl-3">
              <a
                href={bibleUrl(s.ref)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-gold-lt transition-colors hover:text-gold hover:underline"
              >
                {s.ref} &#8599;
              </a>
              <p className="mt-0.5 text-xs text-silver">{s.why}</p>
            </div>
          ))}
        </div>
      )}

      {/* Study ideas */}
      {card.studyIdeas.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Study ideas
          </p>
          <ul className="flex flex-col gap-1">
            {card.studyIdeas.map((idea) => (
              <li key={idea} className="flex items-start gap-2 text-xs text-silver">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-gold/50" />
                {idea}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Leader actions checklist */}
      {card.leaderActions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            For you as leader
          </p>
          <ul className="flex flex-col gap-1.5">
            {card.leaderActions.map((action) => (
              <LeaderActionItem key={action} action={action} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LeaderActionItem({ action }: { action: string }) {
  const [checked, setChecked] = useState(false);

  return (
    <li className="flex items-start gap-2">
      <button
        type="button"
        onClick={() => setChecked((v) => !v)}
        aria-pressed={checked}
        className={cn(
          'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors',
          checked
            ? 'border-gold bg-gold/20 text-gold'
            : 'border-border-sub bg-transparent text-transparent hover:border-gold/50',
        )}
      >
        <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5">
          <path
            d="M2 5.5l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className={cn('text-xs leading-relaxed', checked ? 'text-muted line-through' : 'text-silver')}>
        {action}
      </span>
    </li>
  );
}

/* ============================================================
   Walk with God stat chip
   ============================================================ */

function WalkStat({
  label,
  value,
  accent = '#8a9a92',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-border-sub bg-black-4 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="font-display text-2xl font-light" style={{ color: accent || '#f0f2ee' }}>
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   Section wrapper
   ============================================================ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        {title}
      </p>
      {children}
    </section>
  );
}

/* ============================================================
   Avatar
   ============================================================ */

function Avatar({
  imageUrl,
  initials,
  size,
}: {
  imageUrl: string;
  initials: string;
  size: 'sm' | 'lg';
}) {
  const dim = size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  const text = size === 'lg' ? 'text-base' : 'text-xs';

  if (imageUrl) {
    return (
      <div
        className={cn(dim, 'shrink-0 rounded-full border border-border-gold overflow-hidden')}
        style={{ boxShadow: '0 0 0 2px rgba(201,165,72,0.18)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        dim,
        text,
        'shrink-0 rounded-full border border-border-gold bg-black-4 flex items-center justify-center font-display font-light text-gold-lt',
      )}
      style={{ boxShadow: '0 0 0 2px rgba(201,165,72,0.18)' }}
    >
      {initials}
    </div>
  );
}

/* ============================================================
   Vitality bar (0-10)
   ============================================================ */

function VitalityBar({ value }: { value: number }) {
  const pct = Math.round((Math.min(10, Math.max(0, value)) / 10) * 100);
  const color = value < 4 ? '#f87171' : value < 7 ? '#c9a548' : '#2d6a4f';

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-14 overflow-hidden rounded-full bg-black-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-muted">{value.toFixed(1)}</span>
    </div>
  );
}

/* ============================================================
   Trend arrow
   ============================================================ */

function TrendArrow({ trend, label }: { trend: Trend; label?: boolean }) {
  if (trend === 'none') return null;

  const map: Record<string, { icon: string; color: string; word: string }> = {
    up: { icon: '↑', color: '#2d6a4f', word: 'Rising' },
    down: { icon: '↓', color: '#f87171', word: 'Falling' },
    steady: { icon: '→', color: '#8a9a92', word: 'Steady' },
  };

  const t = map[trend];
  if (!t) return null;

  return (
    <span className="text-xs" style={{ color: t.color }}>
      {t.icon}
      {label && <span className="ml-1 text-[10px]">{t.word}</span>}
    </span>
  );
}

/* ============================================================
   Utility: last active label
   ============================================================ */

function formatLastActive(days: number | null): string {
  if (days === null) return 'not yet';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
