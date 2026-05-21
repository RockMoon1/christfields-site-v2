'use client';

import { motion } from 'motion/react';
import type { GroupAnalytics, MemberSummary } from '@/lib/faithflow/types';

interface GroupOverviewProps {
  org: { id: string; name: string };
  members: MemberSummary[];
  group: GroupAnalytics;
}

/* ============================================================
   Entrance motion helpers
   ============================================================ */

const EASE = [0.22, 1, 0.36, 1] as const;

function fadeUp(index: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.55,
      delay: 0.1 + index * 0.07,
      ease: EASE,
    },
  };
}

/* ============================================================
   Trend arrow (used for mood)
   ============================================================ */

type Trend = 'up' | 'down' | 'steady' | 'none';

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'none' || trend === 'steady') {
    return (
      <span className="ml-1.5 text-xs text-silver" aria-label="steady">
        steady
      </span>
    );
  }
  if (trend === 'up') {
    return (
      <svg
        viewBox="0 0 12 12"
        fill="none"
        className="ml-1.5 inline-block h-3 w-3 text-emerald-lt"
        aria-label="trending up"
      >
        <path d="M2 9 L6 3 L10 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className="ml-1.5 inline-block h-3 w-3 text-gold"
      aria-label="trending down"
    >
      <path d="M2 3 L6 9 L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================
   Vitality ring (circular SVG, 0-10 scale)
   ============================================================ */

function VitalityRing({ value }: { value: number }) {
  const pct = Math.min(value / 10, 1);
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const dash = pct * circumference;

  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px]" aria-hidden>
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={6}
      />
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke="#c9a548"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <text
        x={36}
        y={40}
        textAnchor="middle"
        fill="#e4c97a"
        fontSize={16}
        fontFamily="var(--font-display)"
        fontWeight={300}
      >
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

/* ============================================================
   KPI card (single stat with optional child slot)
   ============================================================ */

interface KpiCardProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  index: number;
}

function KpiCard({ label, hint, children, index }: KpiCardProps) {
  return (
    <motion.div
      {...fadeUp(index)}
      className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6"
    >
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
        animate={{ opacity: [0.3, 0.75, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
      />
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      {children}
      {hint && <p className="mt-3 text-xs text-silver">{hint}</p>}
    </motion.div>
  );
}

/* ============================================================
   Area bar row
   ============================================================ */

interface AreaBarProps {
  name: string;
  avg: number;
  color: string;
  annotation?: 'strong' | 'attention';
}

function AreaBar({ name, avg, color, annotation }: AreaBarProps) {
  const pct = Math.min((avg / 10) * 100, 100);

  return (
    <div className="group flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-xs text-silver">{name}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-ivory-dim">
        {avg.toFixed(1)}
      </span>
      {annotation === 'strong' && (
        <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-emerald-lt">
          strong
        </span>
      )}
      {annotation === 'attention' && (
        <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-gold">
          gentle care
        </span>
      )}
    </div>
  );
}

/* ============================================================
   Member avatar (initial or image)
   ============================================================ */

function MemberAvatar({ name, imageUrl }: { name: string; imageUrl: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border-gold"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-[13px] font-medium text-black">
      {initial}
    </span>
  );
}

/* ============================================================
   Guidance card
   ============================================================ */

interface GuidanceCardData {
  signal: string;
  scriptures: { ref: string; why: string }[];
  studyIdeas: string[];
  leaderActions: string[];
}

function GuidanceCardView({ card, index }: { card: GuidanceCardData; index: number }) {
  return (
    <motion.article
      {...fadeUp(index)}
      className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6"
    >
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
        animate={{ opacity: [0.25, 0.65, 0.25] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      />

      <p className="mb-4 text-sm leading-relaxed text-ivory-dim">{card.signal}</p>

      {card.scriptures.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Scripture
          </p>
          <ul className="flex flex-col gap-2">
            {card.scriptures.map((s, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-gold-lt">{s.ref}</span>
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
            {card.studyIdeas.map((idea, i) => (
              <span
                key={i}
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
            Prayerful starting points
          </p>
          <ul className="flex flex-col gap-2">
            {card.leaderActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-silver">
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
  );
}

/* ============================================================
   Main component
   ============================================================ */

export function GroupOverview({ members, group }: GroupOverviewProps) {
  const attentionMembers = members.filter((m) => m.attention);

  const strongKeys = new Set(group.strongAreas.map((a) => a.presetKey || a.name.toLowerCase()));
  const struggleKeys = new Set(group.strugglingAreas.map((a) => a.presetKey || a.name.toLowerCase()));

  function annotationFor(area: { presetKey: string | null; name: string }): 'strong' | 'attention' | undefined {
    const key = area.presetKey || area.name.toLowerCase();
    if (strongKeys.has(key)) return 'strong';
    if (struggleKeys.has(key)) return 'attention';
    return undefined;
  }

  return (
    <div className="flex flex-col gap-12">

      {/* KPI row */}
      <section aria-label="Group at a glance">
        <motion.p
          {...fadeUp(0)}
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-muted"
        >
          At a glance
        </motion.p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Members" index={0} hint="Total in your group">
            <p className="font-display text-5xl font-light leading-none text-gold-lt">
              {group.memberCount}
            </p>
          </KpiCard>

          <KpiCard
            label="Active this week"
            index={1}
            hint={`of ${group.memberCount} members`}
          >
            <p className="font-display text-5xl font-light leading-none text-gold-lt">
              {group.activeThisWeek}
            </p>
          </KpiCard>

          <KpiCard label="Avg vitality" index={2} hint="Average area score, 0-10">
            <div className="flex items-center gap-3">
              <VitalityRing value={parseFloat(group.avgVitality.toFixed(1))} />
              <p className="text-xs text-silver">out of 10</p>
            </div>
          </KpiCard>

          <KpiCard label="Group mood" index={3} hint="Average mood this period, 1-5">
            {group.moodAvg !== null ? (
              <p className="font-display text-5xl font-light leading-none text-gold-lt">
                {group.moodAvg.toFixed(1)}
                <TrendArrow trend={group.moodTrend} />
              </p>
            ) : (
              <p className="mt-1 text-sm text-silver">Not enough data yet</p>
            )}
          </KpiCard>
        </div>
      </section>

      {/* Area health */}
      {group.areaAverages.length > 0 && (
        <section aria-label="Area health">
          <motion.p
            {...fadeUp(4)}
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted"
          >
            Where the group is
          </motion.p>
          <motion.p
            {...fadeUp(5)}
            className="mb-5 text-sm text-silver"
          >
            Average score per area across all members who have logged data.
          </motion.p>
          <motion.div {...fadeUp(6)} className="flex flex-col gap-3 rounded-sm border border-border-sub bg-black-3 p-6">
            {group.areaAverages
              .slice()
              .sort((a, b) => b.avg - a.avg)
              .map((area) => (
                <AreaBar
                  key={area.presetKey || area.name}
                  name={area.name}
                  avg={area.avg}
                  color={area.color}
                  annotation={annotationFor(area)}
                />
              ))}
          </motion.div>
          {group.strugglingAreas.length > 0 && (
            <motion.p
              {...fadeUp(7)}
              className="mt-3 text-xs text-silver"
            >
              Areas marked "gentle care" are below 4.5 and may need some extra attention in your gathering this week.
            </motion.p>
          )}
        </section>
      )}

      {/* Check-in section */}
      <section aria-label="Members needing a check-in">
        <motion.p
          {...fadeUp(8)}
          className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted"
        >
          Needs a check-in
        </motion.p>
        {attentionMembers.length === 0 ? (
          <motion.p {...fadeUp(9)} className="text-sm text-silver">
            Everyone is steady this week. Rest in that.
          </motion.p>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {attentionMembers.map((member, i) => (
              <motion.div
                key={member.userId}
                {...fadeUp(9 + i)}
                className="flex items-start gap-4 rounded-sm border border-border-sub bg-black-3 p-4"
              >
                <MemberAvatar name={member.name} imageUrl={member.imageUrl} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ivory">{member.name}</p>
                  {member.attentionReasons.length > 0 && (
                    <p className="mt-0.5 text-xs text-silver">
                      {member.attentionReasons.join('. ')}
                      {member.attentionReasons.length > 0 && '.'}
                    </p>
                  )}
                  {member.topStruggle && (
                    <p className="mt-1 text-xs text-muted">
                      Area to pray into: <span className="text-gold-lt">{member.topStruggle}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Guidance */}
      {group.guidance.length > 0 && (
        <section aria-label="How to shepherd this season">
          <motion.p
            {...fadeUp(12)}
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted"
          >
            How to shepherd this season
          </motion.p>
          <motion.p {...fadeUp(13)} className="mb-5 text-sm text-silver">
            These are prayerful starting points drawn from what the data is showing. Use them as prompts, not prescriptions.
          </motion.p>
          <div className="grid gap-4 lg:grid-cols-2">
            {group.guidance.map((card, i) => (
              <GuidanceCardView key={i} card={card} index={14 + i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
