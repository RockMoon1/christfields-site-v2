/**
 * Resources for each progress area, organized into three tiers driven by
 * the user's most recent score.
 *
 *   1-3   Struggling   "I need help."
 *   4-7   Growing      "The humble middle. Getting better, learning from others."
 *   8-10  Leading      "I can help someone else here."
 *
 * Preset areas have hand-written content. Custom areas fall back to a generic
 * template that swaps the area name in. We never show empty resources.
 */

export type Tier = 'struggling' | 'growing' | 'leading';

export interface Resource {
  /** A short label that explains why this item is here. */
  kind: 'reflection' | 'action' | 'scripture' | 'question' | 'video' | 'link';
  body: string;
  /** Optional reference like "Proverbs 27:17" — shown small under a scripture. */
  reference?: string;
  /** URL for video / link resources. */
  url?: string;
  /** Short label for the source (e.g. "Tim Keller", "BibleProject"). */
  source?: string;
}

export interface JournalPrompt {
  /** Headline question the user answers. */
  question: string;
  /** Optional sub-line hint shown smaller. */
  hint?: string;
}

export interface TierContent {
  tier: Tier;
  /** Short framing line shown under the tier badge. */
  intro: string;
  resources: Resource[];
}

export interface AreaResourceBundle {
  struggling: TierContent;
  growing: TierContent;
  leading: TierContent;
}

/** Map a 1-10 score to a tier. Returns 'struggling' if no score yet. */
export function tierFromScore(score: number | undefined | null): Tier {
  if (score === undefined || score === null) return 'struggling';
  if (score <= 3) return 'struggling';
  if (score <= 7) return 'growing';
  return 'leading';
}

export function tierLabel(tier: Tier): string {
  if (tier === 'struggling') return 'Struggling';
  if (tier === 'growing') return 'Growing';
  return 'Leading';
}

export function tierSubtitle(tier: Tier): string {
  if (tier === 'struggling') return 'I need help with this.';
  if (tier === 'growing') return 'The humble middle. Improving, learning from others.';
  return 'I can help someone else here.';
}

/* ============================================================
   Preset content. Keyed by preset_key.
   ============================================================ */

const PRESET_RESOURCES: Record<string, AreaResourceBundle> = {
  presence: {
    struggling: {
      tier: 'struggling',
      intro: 'Showing up is hard. Start small. The goal is not perfection, it is the next yes.',
      resources: [
        { kind: 'reflection', body: 'You do not need to feel ready to come. You just need to come.' },
        { kind: 'action', body: 'Commit to one meeting this month. Put it on your calendar today.' },
        { kind: 'action', body: 'Text someone in your group: "Can you remind me the night before?" That single text starts the habit.' },
        { kind: 'scripture', body: 'Let us consider how we may spur one another on toward love and good deeds, not giving up meeting together.', reference: 'Hebrews 10:24-25' },
      ],
    },
    growing: {
      tier: 'growing',
      intro: 'You are showing up. The next stretch is not more meetings. It is being more present in the ones you already attend.',
      resources: [
        { kind: 'reflection', body: 'Coming is one thing. Arriving is another. Are you actually in the room when you are in the room?' },
        { kind: 'action', body: 'Be the first one there once this month. Notice who comes in after you.' },
        { kind: 'question', body: 'Who in your group did you not greet last meeting? Sit next to them this time.' },
        { kind: 'scripture', body: 'As iron sharpens iron, so one person sharpens another.', reference: 'Proverbs 27:17' },
      ],
    },
    leading: {
      tier: 'leading',
      intro: 'You are consistent. Use that consistency to pull someone else in.',
      resources: [
        { kind: 'action', body: 'Personally invite the person who has been missing. Not a group text. A direct one.' },
        { kind: 'action', body: 'Text them after group ends. Tell them what they would have heard. Not as a guilt trip, as a gift.' },
        { kind: 'reflection', body: 'The people who show up consistently are the bones of a group. Be that quietly.' },
        { kind: 'question', body: 'Is there one person who would come if you offered to drive them or meet them first? Offer.' },
      ],
    },
  },

  honesty: {
    struggling: {
      tier: 'struggling',
      intro: 'Honesty is scary because it costs something. Start with one small true thing.',
      resources: [
        { kind: 'reflection', body: 'You do not have to share the hardest thing first. Share something real, even if it is small.' },
        { kind: 'action', body: 'This week, tell one person in your group one true thing about your week. Not the highlight version.' },
        { kind: 'question', body: 'What is one thing about your week you would normally hide? What if you did not?' },
        { kind: 'scripture', body: 'Therefore, confess your sins to each other and pray for each other so that you may be healed.', reference: 'James 5:16' },
      ],
    },
    growing: {
      tier: 'growing',
      intro: 'You are sharing real things. The question now is whether you are still curating which real things.',
      resources: [
        { kind: 'reflection', body: 'There is a version of honesty that is just performance with vulnerability as a costume. Watch for it in yourself.' },
        { kind: 'question', body: 'What is the thing this week you do NOT want to say? Say that next time.' },
        { kind: 'action', body: 'After your next meeting, ask one person: "What did you not say tonight?" Then trade.' },
        { kind: 'scripture', body: 'Speaking the truth in love, we will grow to become in every respect the mature body of him who is the head.', reference: 'Ephesians 4:15' },
      ],
    },
    leading: {
      tier: 'leading',
      intro: 'You can be trusted with truth. Now create space for other people to bring theirs.',
      resources: [
        { kind: 'action', body: 'Ask a hard question gently. Then wait. Most groups die because no one will sit through silence.' },
        { kind: 'reflection', body: 'The leader does not make people honest. The leader makes the room safe enough that honesty becomes possible.' },
        { kind: 'question', body: 'Who in your group has been telling the curated version lately? Ask them privately how they are actually doing.' },
        { kind: 'scripture', body: 'A friend loves at all times, and a brother is born for a time of adversity.', reference: 'Proverbs 17:17' },
      ],
    },
  },

  scripture: {
    struggling: {
      tier: 'struggling',
      intro: 'Scripture feels heavy or distant. Begin slowly. The goal is presence with the text, not progress through it.',
      resources: [
        { kind: 'action', body: 'Read one chapter of the Gospel of John this week. Read it twice if you can. Twice is better than fast.' },
        { kind: 'reflection', body: 'You are not reading to finish. You are reading to listen.' },
        { kind: 'question', body: 'What is one sentence from the reading that stayed with you? Write it down somewhere visible.' },
        { kind: 'scripture', body: 'Your word is a lamp for my feet, a light on my path.', reference: 'Psalm 119:105' },
      ],
    },
    growing: {
      tier: 'growing',
      intro: 'You are in the Word. The next layer is slowing down even more. Depth, not pages.',
      resources: [
        { kind: 'action', body: 'Pick one verse. Memorize it this month. Slowly. A few words a day.' },
        { kind: 'action', body: 'Read the same chapter three days in a row. Let it talk back.' },
        { kind: 'question', body: 'What part of Scripture do you tend to skip or skim? Start there next time.' },
        { kind: 'scripture', body: 'Like newborn babies, crave pure spiritual milk, so that by it you may grow up in your salvation.', reference: '1 Peter 2:2' },
      ],
    },
    leading: {
      tier: 'leading',
      intro: 'You read it deeply. Now bring someone else into it. Quietly. Not as a teacher.',
      resources: [
        { kind: 'action', body: 'Pick a chapter. Read it with someone else this month. Do not teach. Just read together and ask one question.' },
        { kind: 'reflection', body: 'You are not the source. You are the friend with the lantern. Walk next to them, not in front.' },
        { kind: 'question', body: 'Who in your life would say yes if you asked: "Want to read one chapter together this week?"' },
        { kind: 'scripture', body: 'And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.', reference: '2 Timothy 2:2' },
      ],
    },
  },

  prayer: {
    struggling: {
      tier: 'struggling',
      intro: 'Prayer feels awkward when you are out of practice. It does not need to be eloquent. It needs to be honest.',
      resources: [
        { kind: 'action', body: 'List five names of people you can pray for this week. That is the whole assignment.' },
        { kind: 'reflection', body: 'You are not performing for God. You are talking to a Father.' },
        { kind: 'question', body: 'What is the smallest, most honest sentence you could say to God right now?' },
        { kind: 'scripture', body: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', reference: 'Philippians 4:6' },
      ],
    },
    growing: {
      tier: 'growing',
      intro: 'You are praying. The next step is praying with other people in the room, not just for them.',
      resources: [
        { kind: 'action', body: 'Pray out loud for someone in your group this month. By name. Just once. That is enough.' },
        { kind: 'reflection', body: 'Praying out loud is uncomfortable on purpose. The discomfort is the door.' },
        { kind: 'question', body: 'When was the last time you asked someone "How can I pray for you?" and actually wrote it down?' },
        { kind: 'scripture', body: 'Carry each other’s burdens, and in this way you will fulfill the law of Christ.', reference: 'Galatians 6:2' },
      ],
    },
    leading: {
      tier: 'leading',
      intro: 'You pray for people. Now close the loop. Tell them you did.',
      resources: [
        { kind: 'action', body: 'Ask someone this week what they want prayer for. Write it down. Pray every day. Tell them you did the next time you see them.' },
        { kind: 'reflection', body: 'Most people have been "prayed for" in the abstract. Almost no one has been told "I prayed for you on Tuesday."' },
        { kind: 'question', body: 'Is there someone in your group whose request you forgot last week? Pray for it now. Then tell them.' },
        { kind: 'scripture', body: 'The prayer of a righteous person is powerful and effective.', reference: 'James 5:16' },
      ],
    },
  },

  sharpening: {
    struggling: {
      tier: 'struggling',
      intro: 'You are focused on yourself, which is fine. But growth happens fastest when you start watching for it in someone else too.',
      resources: [
        { kind: 'action', body: 'Pay attention to one person in your group this week. Notice what they are working on without asking.' },
        { kind: 'reflection', body: 'You cannot sharpen what you have not noticed.' },
        { kind: 'question', body: 'Who in your group is most easy to overlook? Why?' },
        { kind: 'scripture', body: 'As iron sharpens iron, so one person sharpens another.', reference: 'Proverbs 27:17' },
      ],
    },
    growing: {
      tier: 'growing',
      intro: 'You are starting to see other people. The next step is to ask, not assume.',
      resources: [
        { kind: 'action', body: 'Ask someone in your group: "What are you working on right now?" Not what they are struggling with. What they want to become.' },
        { kind: 'reflection', body: 'Sharpening is not advice. It is presence with attention.' },
        { kind: 'question', body: 'Who in your life has sharpened YOU recently? Have you told them?' },
        { kind: 'scripture', body: 'Better is open rebuke than hidden love. Wounds from a friend can be trusted, but an enemy multiplies kisses.', reference: 'Proverbs 27:5-6' },
      ],
    },
    leading: {
      tier: 'leading',
      intro: 'You sharpen others well. Now sharpen with a word, not just attention. Speak what you have seen.',
      resources: [
        { kind: 'action', body: 'Tell someone what you have watched them grow in. Out loud. By name. This week.' },
        { kind: 'reflection', body: 'People do not always know they are growing. Be the mirror.' },
        { kind: 'question', body: 'Is there someone in your group who needs to hear a hard thing said in love? Pray about saying it.' },
        { kind: 'scripture', body: 'The tongue has the power of life and death, and those who love it will eat its fruit.', reference: 'Proverbs 18:21' },
      ],
    },
  },
};

/* ============================================================
   Generic template for custom (non-preset) areas. Uses the area
   name so the prompts feel personal even without hand-written
   content.
   ============================================================ */

function templateFor(areaName: string): AreaResourceBundle {
  const name = areaName || 'this area';
  return {
    struggling: {
      tier: 'struggling',
      intro: `Starting is the hardest part. The goal is not to be good at ${name}. The goal is to take one honest step.`,
      resources: [
        { kind: 'reflection', body: `You are not behind. You just have not started yet. Starting is the whole thing.` },
        { kind: 'action', body: `Pick the smallest possible step toward ${name} this week. Smaller than feels useful.` },
        { kind: 'question', body: `Who in your group would not be surprised to hear you are struggling with ${name}? Tell them.` },
        { kind: 'scripture', body: 'For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.', reference: 'Ephesians 2:10' },
      ],
    },
    growing: {
      tier: 'growing',
      intro: `You are past starting. The next stretch is humility: getting better AND being willing to be seen by people who know you.`,
      resources: [
        { kind: 'reflection', body: `Progress is real here. The question is whether you can let other people in on it.` },
        { kind: 'action', body: `Ask someone in your group how they see ${name} in your life right now. Be ready to hear it, not defend yourself.` },
        { kind: 'question', body: `What part of ${name} are you still avoiding even though you have grown elsewhere?` },
        { kind: 'scripture', body: 'Humble yourselves, therefore, under God’s mighty hand, that he may lift you up in due time.', reference: '1 Peter 5:6' },
      ],
    },
    leading: {
      tier: 'leading',
      intro: `You can help someone here. Not as a teacher. As a person who has been there.`,
      resources: [
        { kind: 'action', body: `Pick one person in your group who might be where you were on ${name}. Do not teach. Just share what worked, briefly, and ask what they think.` },
        { kind: 'reflection', body: 'The best help is offered, never imposed. Stay light on the touch.' },
        { kind: 'question', body: `What did YOU need someone to say to you when you were lower on ${name}? Say it to them.` },
        { kind: 'scripture', body: 'And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.', reference: '2 Timothy 2:2' },
      ],
    },
  };
}

/**
 * Given an area (preset or custom) and its latest score, return the right
 * tier of resources. Always returns content, never empty.
 */
export function getResourcesForArea(args: {
  presetKey: string | null;
  areaName: string;
  latestScore: number | null | undefined;
}): TierContent {
  const tier = tierFromScore(args.latestScore);
  const bundle =
    (args.presetKey && PRESET_RESOURCES[args.presetKey]) ||
    templateFor(args.areaName);
  return bundle[tier];
}

/** What the user can look forward to at the next tier up. */
export function nextTierTeaser(currentTier: Tier): string | null {
  if (currentTier === 'struggling')
    return 'When you reach a 4, you will see resources for the humble middle.';
  if (currentTier === 'growing')
    return 'When you reach an 8, you will see resources on how to lead others here.';
  return null;
}

/* ============================================================
   Journal prompts. Change by tier so the reflection space asks
   the right question for where the user actually is.
   ============================================================ */

const JOURNAL_PROMPTS: Record<Tier, JournalPrompt> = {
  struggling: {
    question: 'What have you tried, and what is getting in the way?',
    hint: 'Be honest about effort and resistance. This is for you, not for show.',
  },
  growing: {
    question: 'What is working, and what still feels stuck?',
    hint: 'Name the small wins. Then name what you keep avoiding.',
  },
  leading: {
    question: 'Who are you helping, and what are you noticing in them?',
    hint: 'Track what good leadership looks like by paying attention to fruit, not effort.',
  },
};

export function journalPromptFor(tier: Tier): JournalPrompt {
  return JOURNAL_PROMPTS[tier];
}
