/**
 * Shared types for the FaithFlow leader dashboard.
 *
 * Privacy note: these shapes only ever carry derived status and counts, plus
 * content a member has explicitly shared. Personal journal, examen, gratitude,
 * mood notes, and unshared prayer text never appear here.
 */

export type Tier = 'struggling' | 'growing' | 'leading' | 'none';
export type Trend = 'up' | 'down' | 'steady' | 'none';

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  role: string;
  isLeader: boolean;
}

export interface AreaStatus {
  name: string;
  presetKey: string | null;
  color: string;
  latest: number | null;
  prev: number | null;
  target: number | null;
  tier: Tier;
  count: number;
}

export interface MemberSummary {
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  isLeader: boolean;
  /** Average of latest area scores, 0-10. */
  vitality: number;
  /** Percent of this week's daily rhythm slots kept, 0-100. */
  rhythmConsistency: number;
  moodTrend: Trend;
  moodAvg: number | null; // 1-5
  lastActive: string | null; // YYYY-MM-DD
  daysSinceActive: number | null;
  /** Name of the lowest-scoring area, if any. */
  topStruggle: string | null;
  /** Whether the leader should gently check in. */
  attention: boolean;
  /** Short, plain reasons the member is flagged. */
  attentionReasons: string[];
  hasData: boolean;
}

export interface MemberDetail extends MemberSummary {
  areas: AreaStatus[];
  rhythms: {
    name: string;
    color: string;
    cadence: string;
    weekDone: number;
    target: number;
    streak: number;
    total: number;
    doneToday: boolean;
  }[];
  mood: { date: string; mood: number }[]; // values only, no notes
  prayer: {
    open: number;
    answered: number;
    shared: { title: string; body: string; answered: boolean }[];
  };
  memory: { learning: number; memorized: number };
  guidance: GuidanceCard[];
}

export interface GroupAnalytics {
  memberCount: number;
  activeThisWeek: number;
  avgVitality: number;
  moodAvg: number | null;
  moodTrend: Trend;
  areaAverages: { name: string; presetKey: string | null; color: string; avg: number }[];
  strugglingAreas: { name: string; presetKey: string | null; avg: number }[];
  strongAreas: { name: string; presetKey: string | null; avg: number }[];
  guidance: GuidanceCard[];
}

export interface GuidanceCard {
  /** Plain description of what the data is showing. */
  signal: string;
  scriptures: { ref: string; why: string }[];
  /** Study or plan titles for the leader to prepare, not full content. */
  studyIdeas: string[];
  /** Prompts that push the leader to pray and shepherd, not lean on the tool. */
  leaderActions: string[];
}

export type GroupDataResult =
  | { state: 'ready'; org: { id: string; name: string }; members: MemberSummary[]; group: GroupAnalytics }
  | { state: 'not-leader' }
  | { state: 'no-members'; org: { id: string; name: string } };
