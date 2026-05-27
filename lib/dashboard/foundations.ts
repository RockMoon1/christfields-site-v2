/**
 * The words underneath the dashboard: the welcome a new person meets, the
 * "what we stand for" page, the Scripture that grounds each section, and the
 * quiet verse shown when someone crosses into a new stage.
 *
 * Voice (from the planning sessions):
 *  - Warm, plain, grace-first. No em dashes. Never shaming.
 *  - Welcoming to seekers: you do not have to have it figured out to belong.
 *  - Framed around submission to Christ, not chasing a feeling. The point is
 *    surrender, not self-improvement.
 *  - The gospel is carried through Scripture and tone, never a hard "will you
 *    follow" ask inside the app.
 *  - Blend voice: Lisandro speaks personally at the welcome; everyday section
 *    copy is the group's "we".
 *
 * Pure content only. No imports beyond the journey types.
 */

import type { JourneyStage, SectionKey } from '@/lib/dashboard/journey';

/* ============================================================
   The one-time welcome screen (first sign-in).
   ============================================================ */

export const WELCOME = {
  eyebrow: 'Welcome to Christ Fields',
  heading: 'You are welcome here.',
  /** Personal, from Lisandro. */
  fromLisandro:
    "I am Lisandro. I built this for people I actually know, and I want you here. You do not have to have your faith, or your life, figured out. Come exactly as you are.",
  /** Direct, warm welcome to a seeker. */
  seeker:
    "Maybe you are sure about Jesus. Maybe you are not sure about any of it yet, and you are simply open. That is enough to begin. This is a place to be honest and to grow, not a place to perform.",
  /** The clear teaching, said once. */
  teaching: {
    title: 'One honest thing, up front',
    body: "This is not about chasing a feeling, or a burst of motivation that fades by Thursday. It is about slowly handing your life over to Christ, the one who already gave his for you. Real change comes from surrender, not from trying harder. We grow into that together.",
  },
  /** Gospel through tone, no direct call. */
  close:
    "Whatever you keep track of here stays between you and God. We just walk alongside you. Take your time.",
  cta: 'Step in',
  verse: {
    text: 'Come to me, all who labor and are heavy laden, and I will give you rest.',
    ref: 'Matthew 11:28',
  },
} as const;

/* ============================================================
   The always-available "What we stand for" page.
   ============================================================ */

export interface BeliefBlock {
  title: string;
  body: string;
  ref: string;
}

export const FOUNDATION: {
  eyebrow: string;
  heading: string;
  intro: string;
  beliefs: BeliefBlock[];
  doingTitle: string;
  doing: string;
  gospelTitle: string;
  gospel: string;
} = {
  eyebrow: 'What we stand for',
  heading: 'What this is, and why.',
  intro:
    'Christ Fields is a small community built on one conviction: that life with Jesus is the realest thing there is, and that we were never meant to walk it alone.',
  beliefs: [
    {
      title: 'Christ at the center',
      body: 'Everything here points to Jesus, not to us and not to your own willpower. He holds all of it together, including you.',
      ref: 'Colossians 1:17',
    },
    {
      title: 'Honesty over performance',
      body: 'You do not have to look like you have it together. God wants truth in the inward being, and so do we. This is a safe place to be real.',
      ref: 'Psalm 51:6',
    },
    {
      title: 'Grace, never guilt',
      body: 'There is no condemnation here for those who are in Christ. Missing a day, or a season, never changes how loved you are.',
      ref: 'Romans 8:1',
    },
    {
      title: 'Together, in person',
      body: 'The screen is not the point. We show up for each other face to face, spurring one another on toward love and good deeds.',
      ref: 'Hebrews 10:24-25',
    },
    {
      title: 'Surrender, not striving',
      body: 'We are not trying to earn anything. We are learning to hand our lives over to the One who already gave his for us.',
      ref: 'Galatians 2:20',
    },
  ],
  doingTitle: 'What we actually do',
  doing:
    'We gather in person. We keep a few honest rhythms. We pray for each other by name. We let Scripture shape how we see things. And we trust God to do the growing, in his time.',
  gospelTitle: 'The heart of it',
  gospel:
    'God made you, loves you, and came after you in Jesus. His invitation is open and it is for you. You are free to explore it here, at your own pace, with people who are doing the same.',
} as const;

/* ============================================================
   Per-section foundation: the Scripture that grounds each part of
   the dashboard, framed as a response to Christ. "gentle" is the
   first taste an early member sees; "full" is the deeper grounding.
   ============================================================ */

export interface SectionFoundation {
  verse: string;
  ref: string;
  gentle: string;
  full: string;
}

export const SECTION_FOUNDATIONS: Record<SectionKey, SectionFoundation> = {
  overview: {
    verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.',
    ref: 'Matthew 11:28',
    gentle: 'This is your quiet place to walk with God. Start wherever you are. There is grace for every day.',
    full: 'This is your space to keep company with Christ. Not to impress him, but to come to him, again and again, and find rest.',
  },
  rhythms: {
    verse: 'Take my yoke upon you, and learn from me, for I am gentle and lowly in heart.',
    ref: 'Matthew 11:29',
    gentle: 'Start small. A rhythm is just a way of saying yes to Jesus on an ordinary day. Even one honest habit counts.',
    full: 'Rhythms are not how we earn anything. They are how we keep company with Christ and learn his unforced way of living. Pick the next small yes.',
  },
  prayer: {
    verse: 'Do not be anxious about anything, but in everything by prayer let your requests be made known to God.',
    ref: 'Philippians 4:6',
    gentle: 'Prayer is talking with God, honestly, about anything. You do not need the right words. Just bring it to him.',
    full: 'We bring our requests straight to the Father, not to twist his arm, but to hand them to one who is good. Bring him everything, and let even your wants be reshaped by his will.',
  },
  reflect: {
    verse: 'Search me, O God, and know my heart. Try me and know my thoughts.',
    ref: 'Psalm 139:23',
    gentle: 'A few honest minutes. Name how you really are. God already knows, and he is not afraid of it.',
    full: 'Reflection is letting God search us, so we stop pretending and start surrendering the real thing. Telling the truth about your week is where being changed begins.',
  },
  scripture: {
    verse: 'Your word is a lamp to my feet and a light to my path.',
    ref: 'Psalm 119:105',
    gentle: 'A verse to carry. Read it slowly. Let one line stay with you today.',
    full: 'We do not read Scripture to collect facts. We sit under it so that Christ, the living Word, can shape how we see everything. Hide it in your heart and let it do its slow work.',
  },
  progress: {
    verse: 'He who began a good work in you will bring it to completion at the day of Jesus Christ.',
    ref: 'Philippians 1:6',
    gentle: 'These cards are a place to be honest about a few parts of your life. No scores to chase. Fill one in.',
    full: 'Growth is God’s work in you, not a performance for him. We name where we are honestly, then trust the One who finishes what he starts. The aim is surrender, not self-improvement.',
  },
  resources: {
    verse: 'All Scripture is breathed out by God and profitable for teaching, for training in righteousness.',
    ref: '2 Timothy 3:16',
    gentle: 'A few things to read and pray through, matched to where you are.',
    full: 'Scripture, prompts, and next steps to help you go deeper, always pointing you back to Christ rather than to a technique.',
  },
  community: {
    verse: 'Bear one another’s burdens, and so fulfill the law of Christ.',
    ref: 'Galatians 6:2',
    gentle: 'We carry each other here. Share what you are walking through, or stand with someone in theirs.',
    full: 'Community is not a faster way to get prayers answered. It is how we obey Christ together, carrying each other’s weight and pointing one another back to the Father.',
  },
};

/* ============================================================
   Plain-language notes that explain parts of the dashboard people
   kept misreading. Kept here so the voice stays consistent with the
   rest of the content.
   ============================================================ */

/**
 * Progress cards ship with a suggested goal (e.g. "aiming for 8"). New people
 * read those preset numbers as real scores, or even as someone else's data.
 * They are only examples, so we say so plainly above the cards.
 */
export const PROGRESS_GOALS_NOTE = {
  title: 'About the numbers on each card',
  body: [
    'Each card starts with a suggested goal, like “aiming for 8.” That is only an example, a preview of what a filled-in card looks like.',
    'It is not your score, and it does not count toward anything. Slide each card to your own honest number and press Save. That is the one that becomes yours.',
  ],
} as const;

/**
 * Many people assume Sabbath means one day, usually Sunday. We hold that rest
 * in Christ is a daily gift, opened up when the veil tore, and lived together
 * as a church. Shown on the Rhythms page so the Sabbath card makes sense.
 */
export const SABBATH_NOTE = {
  eyebrow: 'About the Sabbath',
  title: 'Why Sabbath can be every day',
  body: [
    'Sabbath began as one day to stop and rest in God, and a weekly day to slow down is still a gift. But there is a fuller story.',
    'When Jesus died, the temple veil tore in two from top to bottom. The way to God was thrown wide open. We no longer wait for one day, or one place, to come and rest.',
    'So rest is not really a day at all. Rest is a Person. “Come to me,” Jesus said, “and I will give you rest.” You can come today, and tomorrow, and the day after.',
    'And we were never meant to carry it alone. The church is a family, meant to share life often, not gather once and then scatter. Rest together, and lean on each other.',
    'Mark it on as many days as you turn to him. There is no failing here, only coming home.',
  ],
  refs: [
    { label: 'Matthew 27:51', note: 'the veil torn in two' },
    { label: 'Matthew 11:28', note: 'come to me and rest' },
    { label: 'Hebrews 10:24-25', note: 'keep meeting together' },
  ],
} as const;

/* ============================================================
   The quiet "crossing" moment, shown once when a member reaches a
   new stage. A Scripture and a whisper. The stage is never named.
   ============================================================ */

export interface StageUnlock {
  title: string;
  intro: string;
  items: { label: string; note: string; href: string }[];
}

/**
 * What newly opens up at each crossing, named plainly so a member notices the
 * change and actually uses what they have been given. (Seed has the welcome
 * instead, so it has no unlock list.)
 */
export const STAGE_UNLOCKS: Partial<Record<JourneyStage, StageUnlock>> = {
  sprout: {
    title: 'Your space just grew',
    intro: 'As you keep showing up, a little more opens up. Two new places to explore:',
    items: [
      {
        label: 'Reflect',
        note: 'A few honest minutes: how you really are, and what you are thankful for.',
        href: '/dashboard/reflect',
      },
      {
        label: 'Scripture',
        note: 'A verse to carry today, and the ones you are learning by heart.',
        href: '/dashboard/scripture',
      },
    ],
  },
  roots: {
    title: 'You are going deeper',
    intro: 'New ground as your roots grow down:',
    items: [
      {
        label: 'Resources',
        note: 'Scripture and next steps matched to right where you are.',
        href: '/dashboard/resources',
      },
      {
        label: 'Reflect, deeper',
        note: 'The nightly examen, and a gentle way to reframe a hard thought.',
        href: '/dashboard/reflect',
      },
      {
        label: 'Scripture memory',
        note: 'Hide verses in your heart and return to them over time.',
        href: '/dashboard/scripture',
      },
    ],
  },
  fruit: {
    title: 'Time to bear fruit',
    intro: 'This part of the walk turns outward, toward the people around you:',
    items: [
      {
        label: 'Sharpening others',
        note: 'Help someone else grow, as iron sharpens iron.',
        href: '/dashboard/progress',
      },
      {
        label: 'Carrying the community',
        note: 'Bear one another’s burdens, and so fulfill the law of Christ.',
        href: '/dashboard/community',
      },
    ],
  },
};

export const STAGE_MOMENTS: Record<JourneyStage, { verse: string; ref: string; whisper: string }> = {
  seed: {
    verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.',
    ref: 'Matthew 11:28',
    whisper: 'Welcome. Start here.',
  },
  sprout: {
    verse: 'I planted, Apollos watered, but God gave the growth.',
    ref: '1 Corinthians 3:6',
    whisper: 'Something is taking root.',
  },
  roots: {
    verse: 'Rooted and built up in him and established in the faith.',
    ref: 'Colossians 2:7',
    whisper: 'You are going deeper.',
  },
  fruit: {
    verse: 'Whoever abides in me and I in him, he it is that bears much fruit.',
    ref: 'John 15:5',
    whisper: 'This is what it looks like to bear fruit.',
  },
};
