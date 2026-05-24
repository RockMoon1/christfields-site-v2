/**
 * The journey engine: a pure, deterministic read of where a member is on their
 * walk, used to decide how much of the dashboard to reveal.
 *
 * From the planning sessions, the rules are:
 *
 *  - Four stages, NEVER named to the member: seed -> sprout -> roots -> fruit.
 *    They quietly drive what the dashboard shows; the member only feels it grow.
 *
 *  - In-person presence is a GATE. Seed and Sprout are reachable through the
 *    private walk alone, but Roots and Fruit are LOCKED until a member has shown
 *    up in person (leader-confirmed) enough times. The app cannot hand you the
 *    deep thing; the gathering does.
 *
 *  - Within whatever the gate allows, an even blend of honesty, consistency,
 *    and breadth (with a gentle time floor) sets the actual stage and how deep
 *    each section runs. This is the "all of the above" growth model.
 *
 *  - Growth only ever moves forward in the UI (see journey_seen_stage on the
 *    prefs row); going quiet never strips what was already revealed.
 *
 * This module imports nothing and never touches the database, so it is trivial
 * to reason about and to test. The server gathers the signals; this decides.
 */

export type JourneyStage = 'seed' | 'sprout' | 'roots' | 'fruit';

export const STAGE_ORDER: readonly JourneyStage[] = ['seed', 'sprout', 'roots', 'fruit'];

export function stageRank(s: JourneyStage): number {
  return STAGE_ORDER.indexOf(s);
}
export function maxStage(a: JourneyStage, b: JourneyStage): JourneyStage {
  return stageRank(a) >= stageRank(b) ? a : b;
}
export function minStage(a: JourneyStage, b: JourneyStage): JourneyStage {
  return stageRank(a) <= stageRank(b) ? a : b;
}

/** Sections of the member dashboard whose depth the journey tunes. */
export type SectionKey =
  | 'overview'
  | 'rhythms'
  | 'prayer'
  | 'reflect'
  | 'scripture'
  | 'progress'
  | 'resources'
  | 'community';

/**
 * Per-section depth.
 *  - 'hidden' — not surfaced yet (still reachable via "show me everything").
 *  - 'gentle' — a soft first taste.
 *  - 'full'   — the complete tool.
 *  - 'deep'   — full, plus the outward, fruit-bearing extras.
 */
export type SectionDepth = 'hidden' | 'gentle' | 'full' | 'deep';

const DEPTH_ORDER: readonly SectionDepth[] = ['hidden', 'gentle', 'full', 'deep'];

export function depthRank(d: SectionDepth): number {
  return DEPTH_ORDER.indexOf(d);
}
/** True if a section should appear at all at this depth. */
export function isRevealed(d: SectionDepth): boolean {
  return d !== 'hidden';
}
/** True if a section should show its complete (or deeper) form. */
export function isFull(d: SectionDepth): boolean {
  return depthRank(d) >= depthRank('full');
}

/**
 * The raw signals the server gathers. All counts are measured SINCE the
 * member's journey began (their journey_started_at), so the journey is a fresh
 * walk from launch rather than a tally of old history.
 */
export interface JourneySignals {
  /** Days since the member's journey began (their first load after launch). */
  daysSinceStart: number;
  /** Distinct weeks of leader-confirmed in-person attendance since start. */
  confirmedWeeks: number;
  /** Distinct calendar days with ANY logged activity since start. */
  activeDays: number;
  /** Daily-rhythm slots kept this week (summed across daily rhythms). */
  rhythmsKeptThisWeek: number;
  /** Honest-reflection entries since start (mood + gratitude + examen + reframe). */
  reflectionCount: number;
  /** Progress scores logged since start (self-honesty about each area). */
  progressEntryCount: number;
  /** Prayer requests held since start. */
  prayerCount: number;
  /** Verses being learned or hidden in the heart since start. */
  verseCount: number;
  /** Community posts + intercessions since start (bearing one another's burdens). */
  communityCount: number;
}

/* ============================================================
   The in-person gate. Tunable thresholds.
   ============================================================ */

export const GATE = {
  /** Confirmed weeks of attendance needed to UNLOCK the Roots ceiling. */
  rootsWeeks: 2,
  /** Confirmed weeks of attendance needed to UNLOCK the Fruit ceiling. */
  fruitWeeks: 5,
} as const;

/**
 * The ceiling set by showing up in person. Engagement alone cannot pass this:
 * without attendance a member can still grow to Sprout through the private
 * walk, but no further. This is what makes the gathering, not the app, the gate.
 */
export function attendanceCeiling(confirmedWeeks: number): JourneyStage {
  if (confirmedWeeks >= GATE.fruitWeeks) return 'fruit';
  if (confirmedWeeks >= GATE.rootsWeeks) return 'roots';
  return 'sprout';
}

/**
 * The stage showing up in person earns directly. In-person presence is the
 * heartbeat, so it is the main driver: each gathering moves the member forward
 * on its own, regardless of the private walk. Engagement matters too (see
 * computeJourney), but it cannot, by itself, carry someone past the gate.
 */
export function attendanceFloor(confirmedWeeks: number): JourneyStage {
  if (confirmedWeeks >= GATE.fruitWeeks) return 'fruit';
  if (confirmedWeeks >= GATE.rootsWeeks) return 'roots';
  if (confirmedWeeks >= 1) return 'sprout';
  return 'seed';
}

/* ============================================================
   Engagement blend — honesty, consistency, breadth (even weight).
   Each subscore saturates so a little faithfulness already counts.
   ============================================================ */

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Honesty: telling the truth about your week (reflection + honest self-scoring). */
function honestyScore(s: JourneySignals): number {
  return clamp01((s.reflectionCount + s.progressEntryCount) / 12);
}

/** Consistency: returning over time, not intensity. */
function consistencyScore(s: JourneySignals): number {
  const returning = s.activeDays / 14; // a gentle two-week horizon
  const thisWeek = s.rhythmsKeptThisWeek / 10;
  return clamp01(returning * 0.7 + thisWeek * 0.3);
}

/** Breadth: how much of the walk a member has tasted (distinct domains). */
function breadthScore(s: JourneySignals): number {
  let domains = 0;
  if (s.rhythmsKeptThisWeek > 0) domains += 1;
  if (s.reflectionCount > 0) domains += 1;
  if (s.progressEntryCount > 0) domains += 1;
  if (s.prayerCount > 0) domains += 1;
  if (s.verseCount > 0) domains += 1;
  if (s.communityCount > 0) domains += 1;
  return clamp01(domains / 6);
}

export function engagementScore(s: JourneySignals): number {
  return (honestyScore(s) + consistencyScore(s) + breadthScore(s)) / 3;
}

/** The stage the engagement blend alone would support (before the gate). */
export function engagementStage(score: number): JourneyStage {
  if (score >= 0.7) return 'fruit';
  if (score >= 0.4) return 'roots';
  if (score >= 0.15) return 'sprout';
  return 'seed';
}

/** A gentle time floor: let the welcome breathe before anything grows. */
const SEED_FLOOR_DAYS = 1;

/* ============================================================
   Per-section depth: a base matrix by stage, plus a small per-section
   "run-ahead" so a section a member leans into reveals a little sooner.
   ============================================================ */

const DEPTH_BY_STAGE: Record<JourneyStage, Record<SectionKey, SectionDepth>> = {
  seed: {
    overview: 'gentle',
    rhythms: 'gentle',
    progress: 'gentle', // the heart card is the on-ramp ("fill a card")
    community: 'gentle',
    prayer: 'gentle',
    reflect: 'hidden',
    scripture: 'hidden',
    resources: 'hidden',
  },
  sprout: {
    overview: 'full',
    rhythms: 'full',
    progress: 'gentle',
    community: 'full',
    prayer: 'full',
    reflect: 'gentle',
    scripture: 'gentle',
    resources: 'hidden',
  },
  roots: {
    overview: 'full',
    rhythms: 'full',
    progress: 'full',
    community: 'full',
    prayer: 'full',
    reflect: 'full',
    scripture: 'full',
    resources: 'gentle',
  },
  fruit: {
    overview: 'deep',
    rhythms: 'full',
    progress: 'deep',
    community: 'deep',
    prayer: 'full',
    reflect: 'full',
    scripture: 'full',
    resources: 'full',
  },
};

function bumpDepth(d: SectionDepth, by = 1): SectionDepth {
  return DEPTH_ORDER[Math.min(DEPTH_ORDER.length - 1, depthRank(d) + by)];
}

function sectionDepths(stage: JourneyStage, signals: JourneySignals): Record<SectionKey, SectionDepth> {
  const base: Record<SectionKey, SectionDepth> = { ...DEPTH_BY_STAGE[stage] };

  // Run-ahead: a section a member clearly leans into reveals a little sooner.
  if (signals.verseCount >= 2 && base.scripture === 'hidden') base.scripture = 'gentle';
  if (signals.reflectionCount >= 3 && base.reflect === 'hidden') base.reflect = 'gentle';
  if (signals.progressEntryCount >= 5) base.progress = bumpDepth(base.progress);
  if (signals.communityCount >= 3) base.community = bumpDepth(base.community);

  // 'deep' (the outward, fruit-bearing flourish) stays reserved for the Fruit
  // stage; a run-ahead bump can reach 'full' but never 'deep'.
  if (stage !== 'fruit') {
    (Object.keys(base) as SectionKey[]).forEach((k) => {
      if (base[k] === 'deep') base[k] = 'full';
    });
  }

  return base;
}

/* ============================================================
   The computed journey.
   ============================================================ */

export interface Journey {
  /** The stage the member is actually at (gate applied). Never shown by name. */
  stage: JourneyStage;
  /** The ceiling the in-person gate currently allows. */
  ceiling: JourneyStage;
  /** What engagement alone would support, before the gate. */
  reachedByEngagement: JourneyStage;
  /** The blended engagement score, 0..1. */
  engagement: number;
  /** Per-section depth after the run-ahead bumps. */
  sections: Record<SectionKey, SectionDepth>;
  /** True when the deeper stages are still locked purely for lack of attendance. */
  gatedByAttendance: boolean;
  signals: JourneySignals;
}

/**
 * @param floorStage The highest stage the member has already reached (their
 *   high-water mark). Growth only ever moves forward: a quiet week may lower
 *   what engagement alone would support, but it never reveals less than what
 *   has already been unlocked. Because the attendance ceiling is cumulative,
 *   this floor can never push a member past the in-person gate.
 */
export function computeJourney(signals: JourneySignals, floorStage: JourneyStage = 'seed'): Journey {
  const ceiling = attendanceCeiling(signals.confirmedWeeks);
  const floor = attendanceFloor(signals.confirmedWeeks);
  const engagement = engagementScore(signals);

  let reachedByEngagement = engagementStage(engagement);
  // Time floor: brand-new members rest at seed for the first day, no matter
  // how fast they fill things in.
  if (signals.daysSinceStart < SEED_FLOOR_DAYS) reachedByEngagement = 'seed';

  // Engagement, but never past the in-person gate.
  const byEngagement = minStage(ceiling, reachedByEngagement);
  // Showing up is the main driver: take whichever is further along, the stage
  // earned by attendance or the stage earned by the (gated) private walk.
  const earned = maxStage(floor, byEngagement);
  // Grace: never reveal less than the high-water mark already reached.
  const stage = maxStage(earned, floorStage);
  const gatedByAttendance = stageRank(reachedByEngagement) > stageRank(ceiling);

  return {
    stage,
    ceiling,
    reachedByEngagement,
    engagement,
    sections: sectionDepths(stage, signals),
    gatedByAttendance,
    signals,
  };
}

/**
 * Apply the member's "show me everything" preference. Reveal-all lifts every
 * hidden or gentle section to 'full' so nothing is ever gated against a
 * curious member, but it does not fabricate 'deep' — the outward flourish stays
 * an honest sign of real growth.
 */
export function withRevealAll(
  sections: Record<SectionKey, SectionDepth>,
  revealAll: boolean,
): Record<SectionKey, SectionDepth> {
  if (!revealAll) return sections;
  const out = {} as Record<SectionKey, SectionDepth>;
  (Object.keys(sections) as SectionKey[]).forEach((k) => {
    out[k] = depthRank(sections[k]) < depthRank('full') ? 'full' : sections[k];
  });
  return out;
}

/** The week anchor (Sunday, UTC, YYYY-MM-DD) for a date — one attendance per week. */
export function weekAnchorUTC(ref: Date = new Date()): string {
  const r = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const sunday = new Date(r.getTime() - r.getUTCDay() * 86_400_000);
  return sunday.toISOString().slice(0, 10);
}

/**
 * The serializable view handed to the UI. Plain data only, safe to pass from a
 * server component into the client JourneyProvider.
 */
export interface JourneyView {
  journey: Journey;
  /** Per-section depth after applying the member's "show me everything" choice. */
  sections: Record<SectionKey, SectionDepth>;
  revealAll: boolean;
  welcomeSeen: boolean;
  seenStage: JourneyStage;
  /** The newly reached stage to celebrate once, or null if nothing to mark. */
  crossedInto: JourneyStage | null;
}

const ZERO_SIGNALS: JourneySignals = {
  daysSinceStart: 0,
  confirmedWeeks: 0,
  activeDays: 0,
  rhythmsKeptThisWeek: 0,
  reflectionCount: 0,
  progressEntryCount: 0,
  prayerCount: 0,
  verseCount: 0,
  communityCount: 0,
};

/**
 * A safe view used when the journey cannot be computed (e.g. a database hiccup).
 * It hides nothing and celebrates nothing, so the dashboard always stays usable.
 */
export function fallbackJourneyView(): JourneyView {
  const journey = computeJourney(ZERO_SIGNALS);
  return {
    journey,
    sections: withRevealAll(journey.sections, true),
    revealAll: true,
    welcomeSeen: true,
    seenStage: 'seed',
    crossedInto: null,
  };
}
