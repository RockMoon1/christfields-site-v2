import type { AreaStatus, GuidanceCard, Trend } from './types';

/**
 * The guidance engine. It reads status signals and offers Scripture, study or
 * plan titles, and leader prompts. It is deliberately not a script. It points
 * the leader toward prayer and their own preparation. The leader still has to
 * seek God and do the work. These are starting places, not answers.
 */

interface AreaGuide {
  scriptures: { ref: string; why: string }[];
  studyIdeas: string[];
  actions: string[];
}

const AREA_GUIDANCE: Record<string, AreaGuide> = {
  scripture: {
    scriptures: [
      { ref: 'Psalm 119:105', why: 'The Word as light for the next step.' },
      { ref: 'Joshua 1:8', why: 'Meditating on it day and night.' },
      { ref: '2 Timothy 3:16-17', why: 'What Scripture is for.' },
    ],
    studyIdeas: ['A slow walk through one Gospel together', 'What the Bible says about itself (2 Timothy 3)'],
    actions: [
      'Pray for a real hunger for the Word in them.',
      'Ask what makes opening the Bible hard right now.',
      'Read one short passage together this week, no pressure to perform.',
    ],
  },
  prayer: {
    scriptures: [
      { ref: 'Philippians 4:6-7', why: 'Anxiety handed over in prayer.' },
      { ref: 'Matthew 6:9-13', why: 'How Jesus taught us to pray.' },
      { ref: '1 Thessalonians 5:17', why: 'Prayer as a steady rhythm.' },
    ],
    studyIdeas: ['The Lord’s Prayer, line by line', 'Praying honestly when it feels dry'],
    actions: [
      'Pray with them out loud this week, even briefly.',
      'Ask what they picture God being like when they pray.',
      'Share one of your own honest prayers first.',
    ],
  },
  presence: {
    scriptures: [
      { ref: 'Hebrews 10:24-25', why: 'Not giving up meeting together.' },
      { ref: 'Ecclesiastes 4:9-10', why: 'Two are better than one.' },
      { ref: 'Proverbs 27:17', why: 'We sharpen each other in person.' },
    ],
    studyIdeas: ['Why we are not meant to grow alone', 'The one another’s of the New Testament'],
    actions: [
      'Reach out personally before the next gathering.',
      'Ask gently what is keeping them from showing up.',
      'Make sure they know they are wanted, not just expected.',
    ],
  },
  honesty: {
    scriptures: [
      { ref: 'James 5:16', why: 'Confess to each other and be healed.' },
      { ref: '1 John 1:9', why: 'He is faithful to forgive.' },
      { ref: 'Psalm 51:6', why: 'God desires truth in the inner being.' },
    ],
    studyIdeas: ['Confession and the freedom on the other side', 'Psalm 51 as a model for coming clean'],
    actions: [
      'Go first. Share something real and unpolished with them.',
      'Make it safe to tell the truth without being fixed.',
      'Pray for courage for both of you.',
    ],
  },
  sharpening: {
    scriptures: [
      { ref: 'Proverbs 27:17', why: 'Iron sharpens iron.' },
      { ref: 'Galatians 6:1-2', why: 'Restoring gently, carrying burdens.' },
      { ref: 'Hebrews 3:13', why: 'Encourage one another daily.' },
    ],
    studyIdeas: ['Bearing one another’s burdens', 'What healthy accountability looks like'],
    actions: [
      'Pair them with someone to encourage this week.',
      'Ask who they are pouring into right now.',
      'Model it: tell them one way they have sharpened you.',
    ],
  },
};

const GENERIC_AREA_GUIDE: AreaGuide = {
  scriptures: [
    { ref: 'Philippians 1:6', why: 'He who began a good work will finish it.' },
    { ref: 'Galatians 6:9', why: 'Do not grow weary in doing good.' },
  ],
  studyIdeas: ['A short study tied to this specific area'],
  actions: [
    'Pray about this area with them by name.',
    'Ask one honest question about where they feel stuck.',
  ],
};

const LOW_MOOD_GUIDE: AreaGuide = {
  scriptures: [
    { ref: 'Psalm 34:18', why: 'Near to the brokenhearted.' },
    { ref: 'Matthew 11:28-30', why: 'Rest for the weary.' },
    { ref: 'Lamentations 3:22-23', why: 'Mercies new every morning.' },
  ],
  studyIdeas: ['Lament: the prayers we are allowed to pray', 'Rest for the weary (Matthew 11)'],
  actions: [
    'Check in personally and gently this week, with no agenda.',
    'Pray for their heart by name before you reach out.',
    'Ask how they are really doing, then just listen.',
  ],
};

const DRIFTING_GUIDE: AreaGuide = {
  scriptures: [
    { ref: 'Luke 15:4-7', why: 'The one who goes after the one.' },
    { ref: 'Hebrews 10:24-25', why: 'Spurring one another on.' },
    { ref: 'James 5:19-20', why: 'Bringing back the one who wanders.' },
  ],
  studyIdeas: ['The heart of God for the one who drifts'],
  actions: [
    'Send a simple, warm note: we miss you, no guilt.',
    'Remind them they belong here, not because of their streak.',
    'Pray for them, then reach out without pressure.',
  ],
};

function tierIsStruggling(a: AreaStatus): boolean {
  return a.tier === 'struggling';
}

export interface MemberGuidanceInput {
  name: string;
  areas: AreaStatus[];
  moodTrend: Trend;
  daysSinceActive: number | null;
  rhythmConsistency: number;
  hasData: boolean;
}

export function guidanceForMember(m: MemberGuidanceInput): GuidanceCard[] {
  const cards: GuidanceCard[] = [];

  if (!m.hasData) {
    cards.push({
      signal: `${m.name} has not logged anything yet.`,
      scriptures: [{ ref: 'Philippians 1:6', why: 'God is the one who carries the work.' }],
      studyIdeas: ['Walk through the dashboard together once'],
      leaderActions: [
        'Sit with them and set up their first rhythm.',
        'Keep it light. The point is walking with God, not filling in an app.',
      ],
    });
    return cards;
  }

  // Weakest struggling area.
  const scored = m.areas.filter((a) => a.latest !== null);
  const weakest = scored.slice().sort((a, b) => (a.latest ?? 99) - (b.latest ?? 99))[0];
  if (weakest && tierIsStruggling(weakest)) {
    const g = (weakest.presetKey && AREA_GUIDANCE[weakest.presetKey]) || GENERIC_AREA_GUIDE;
    cards.push({
      signal: `${weakest.name} is the hardest area right now (${weakest.latest}/10).`,
      scriptures: g.scriptures,
      studyIdeas: g.studyIdeas,
      leaderActions: g.actions,
    });
  }

  if (m.moodTrend === 'down') {
    cards.push({
      signal: `${m.name}'s mood has been trending down.`,
      scriptures: LOW_MOOD_GUIDE.scriptures,
      studyIdeas: LOW_MOOD_GUIDE.studyIdeas,
      leaderActions: LOW_MOOD_GUIDE.actions,
    });
  }

  if (m.daysSinceActive !== null && m.daysSinceActive >= 7) {
    cards.push({
      signal: `It has been ${m.daysSinceActive} days since ${m.name} last showed up here.`,
      scriptures: DRIFTING_GUIDE.scriptures,
      studyIdeas: DRIFTING_GUIDE.studyIdeas,
      leaderActions: DRIFTING_GUIDE.actions,
    });
  }

  if (cards.length === 0) {
    cards.push({
      signal: `${m.name} is walking steadily right now.`,
      scriptures: [
        { ref: '1 Thessalonians 5:11', why: 'Encourage and build one another up.' },
        { ref: 'Philippians 1:6', why: 'He will carry it to completion.' },
      ],
      studyIdeas: ['Name the growth and ask what God is teaching them'],
      leaderActions: [
        'Tell them specifically what you see God doing in them.',
        'Ask who they could encourage next.',
      ],
    });
  }

  return cards.slice(0, 3);
}

export interface GroupGuidanceInput {
  strugglingAreas: { name: string; presetKey: string | null; avg: number }[];
  moodTrend: Trend;
  activeThisWeek: number;
  memberCount: number;
}

export function guidanceForGroup(g: GroupGuidanceInput): GuidanceCard[] {
  const cards: GuidanceCard[] = [];

  const hardest = g.strugglingAreas[0];
  if (hardest) {
    const guide = (hardest.presetKey && AREA_GUIDANCE[hardest.presetKey]) || GENERIC_AREA_GUIDE;
    cards.push({
      signal: `As a group, ${hardest.name} is the lowest area (avg ${hardest.avg.toFixed(1)}/10).`,
      scriptures: guide.scriptures,
      studyIdeas: guide.studyIdeas,
      leaderActions: [
        `Consider a short series on ${hardest.name.toLowerCase()} for the whole group.`,
        'Pray over this area before you teach into it.',
      ],
    });
  }

  const participation = g.memberCount > 0 ? g.activeThisWeek / g.memberCount : 0;
  if (g.moodTrend === 'down' || participation < 0.5) {
    cards.push({
      signal:
        participation < 0.5
          ? 'Fewer than half the group has been active this week.'
          : 'The group’s mood has been trending down.',
      scriptures: [
        { ref: 'Galatians 6:2', why: 'Carry each other’s burdens.' },
        { ref: 'Hebrews 10:24-25', why: 'Keep meeting and spurring on.' },
      ],
      studyIdeas: ['A gathering focused on rest and honesty, not output'],
      leaderActions: [
        'Reach out to the quiet ones personally this week.',
        'Open the next gathering by asking how everyone really is.',
        'Pray for the group by name before you meet.',
      ],
    });
  }

  if (cards.length === 0) {
    cards.push({
      signal: 'The group is walking well together right now.',
      scriptures: [
        { ref: '1 Thessalonians 5:11', why: 'Encourage and build one another up.' },
        { ref: 'Philippians 1:6', why: 'He will complete the work.' },
      ],
      studyIdeas: ['Celebrate and give thanks together'],
      leaderActions: [
        'Name the growth out loud at your next gathering.',
        'Thank God with them, specifically.',
      ],
    });
  }

  return cards.slice(0, 3);
}

/* ============================================================
   Open any reference in a Bible app so leaders can research
   freely. We guide with Scripture, we do not replace it.
   ============================================================ */

export function bibleUrl(ref: string, translation = 'ESV'): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${translation}`;
}
