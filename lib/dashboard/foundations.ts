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

