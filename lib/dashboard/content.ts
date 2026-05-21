/**
 * Shared, research-informed content for the dashboard. Imported by feature
 * pages (Reflect, Scripture, Overview, Community) so copy stays consistent.
 *
 * Voice: warm, plain, grace-first. No em dashes. The whole point of this
 * product is that it never shames. Every prompt should feel like a friend,
 * not a scorekeeper.
 */

export interface VerseOfDay {
  reference: string;
  verse_text: string;
  translation: string;
}

/**
 * Verse of the day pool. Rotates by day of year so everyone sees the same
 * verse on the same day. Kept short on purpose so wording stays stable.
 */
export const VERSES_OF_DAY: VerseOfDay[] = [
  { reference: 'Lamentations 3:22-23', verse_text: 'The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.', translation: 'ESV' },
  { reference: 'Psalm 46:10', verse_text: 'Be still, and know that I am God.', translation: 'ESV' },
  { reference: 'Philippians 4:6-7', verse_text: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.', translation: 'ESV' },
  { reference: 'Proverbs 3:5-6', verse_text: 'Trust in the Lord with all your heart, and do not lean on your own understanding.', translation: 'ESV' },
  { reference: 'Matthew 11:28', verse_text: 'Come to me, all who labor and are heavy laden, and I will give you rest.', translation: 'ESV' },
  { reference: 'Isaiah 40:31', verse_text: 'They who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.', translation: 'ESV' },
  { reference: 'Romans 8:1', verse_text: 'There is therefore now no condemnation for those who are in Christ Jesus.', translation: 'ESV' },
  { reference: 'Psalm 23:1', verse_text: 'The Lord is my shepherd; I shall not want.', translation: 'ESV' },
  { reference: 'Joshua 1:9', verse_text: 'Be strong and courageous. Do not be frightened, for the Lord your God is with you wherever you go.', translation: 'ESV' },
  { reference: 'Psalm 119:105', verse_text: 'Your word is a lamp to my feet and a light to my path.', translation: 'ESV' },
  { reference: 'Isaiah 41:10', verse_text: 'Fear not, for I am with you; be not dismayed, for I am your God.', translation: 'ESV' },
  { reference: '2 Corinthians 12:9', verse_text: 'My grace is sufficient for you, for my power is made perfect in weakness.', translation: 'ESV' },
  { reference: 'Galatians 6:9', verse_text: 'Let us not grow weary of doing good, for in due season we will reap, if we do not give up.', translation: 'ESV' },
  { reference: 'Psalm 34:18', verse_text: 'The Lord is near to the brokenhearted and saves the crushed in spirit.', translation: 'ESV' },
  { reference: 'Zephaniah 3:17', verse_text: 'The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness.', translation: 'ESV' },
  { reference: 'Matthew 6:34', verse_text: 'Do not be anxious about tomorrow, for tomorrow will be anxious for itself.', translation: 'ESV' },
  { reference: 'Philippians 4:13', verse_text: 'I can do all things through him who strengthens me.', translation: 'ESV' },
  { reference: 'Psalm 143:8', verse_text: 'Let me hear in the morning of your steadfast love, for in you I trust.', translation: 'ESV' },
  { reference: '1 Thessalonians 5:11', verse_text: 'Therefore encourage one another and build one another up, just as you are doing.', translation: 'ESV' },
  { reference: 'Proverbs 27:17', verse_text: 'Iron sharpens iron, and one man sharpens another.', translation: 'ESV' },
];

/** Returns the verse for a given date, rotating through the pool. */
export function verseForToday(d: Date = new Date()): VerseOfDay {
  const startOfYear = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dayOfYear = Math.floor((today - startOfYear) / 86400000);
  return VERSES_OF_DAY[dayOfYear % VERSES_OF_DAY.length];
}

/* ============================================================
   Mood + emotion vocabulary (affect labeling).
   ============================================================ */

export interface MoodLevel {
  value: number; // 1-5
  label: string;
  color: string;
  caption: string;
}

/** A gentle 1-5 scale. No red, no "bad". Just honest. */
export const MOOD_LEVELS: MoodLevel[] = [
  { value: 1, label: 'Heavy', color: '#7e6ba8', caption: 'Carrying a lot today.' },
  { value: 2, label: 'Low', color: '#5b8db8', caption: 'A bit weighed down.' },
  { value: 3, label: 'Steady', color: '#8a9a92', caption: 'Holding even.' },
  { value: 4, label: 'Glad', color: '#52b788', caption: 'Lighter, thankful.' },
  { value: 5, label: 'Full', color: '#e4c97a', caption: 'Alive and grateful.' },
];

/**
 * Precise emotion words grouped by feel. Offering specific words helps a
 * person name what is actually going on, which research shows calms the
 * nervous system on its own.
 */
export const EMOTION_WORDS: { group: string; words: string[] }[] = [
  { group: 'Heavy', words: ['Anxious', 'Afraid', 'Overwhelmed', 'Discouraged', 'Lonely', 'Numb'] },
  { group: 'Tender', words: ['Sad', 'Tired', 'Tense', 'Restless', 'Unsettled', 'Grieving'] },
  { group: 'Settled', words: ['Calm', 'Content', 'Rested', 'Peaceful', 'Still', 'Steady'] },
  { group: 'Bright', words: ['Joyful', 'Hopeful', 'Grateful', 'Loved', 'Energized', 'Alive'] },
];

/* ============================================================
   Gratitude + Examen + grace.
   ============================================================ */

export const GRATITUDE_PROMPTS: string[] = [
  'Three things you are thankful for today.',
  'Where did you see God’s hand today?',
  'Name a small mercy from the last 24 hours.',
  'Who are you grateful for right now?',
  'What is one good thing you almost missed?',
];

export interface ExamenStep {
  key: 'consolation' | 'desolation' | 'intention';
  title: string;
  prompt: string;
  hint: string;
}

/** The nightly examen. Ends in grace, never a score. */
export const EXAMEN_STEPS: ExamenStep[] = [
  {
    key: 'consolation',
    title: 'Where was the light',
    prompt: 'Where did you sense God with you today?',
    hint: 'A moment, a person, a small gift. Anything that felt like life.',
  },
  {
    key: 'desolation',
    title: 'Where was it heavy',
    prompt: 'Where did you feel far, or drained, or short?',
    hint: 'Name it honestly. There is no condemnation here.',
  },
  {
    key: 'intention',
    title: 'Tomorrow',
    prompt: 'What do you want to carry into tomorrow?',
    hint: 'One simple intention is enough.',
  },
];

export const EXAMEN_CLOSING =
  'There is no condemnation for those who are in Christ. Rest in the grace that holds you. Romans 8:1.';

/** Shown when a day is missed or a hard mood is logged. Warm, never shaming. */
export const GRACE_NOTES: string[] = [
  'Missing a day does not undo God’s love for you.',
  'His mercies are new every morning. You can begin again right now.',
  'Grace covers this day. Pick it back up when you are ready.',
  'You are not behind. You are held. Lamentations 3:22-23.',
  'Rest is not failure. Come to him and find rest.',
];

export function graceNoteForToday(d: Date = new Date()): string {
  const day = d.getUTCDate();
  return GRACE_NOTES[day % GRACE_NOTES.length];
}

/** Short encouragements for the community wall and faith-friend reactions. */
export const ENCOURAGEMENTS: string[] = [
  'Praying for you.',
  'He is with you in this.',
  'Keep going, friend.',
  'You are not alone.',
  'Holding this with you.',
];

/* ============================================================
   CBT reframe helps. Theme to Scripture pairing
   ("be transformed by the renewing of your mind", Rom 12:2).
   ============================================================ */

export interface ReframeHelp {
  theme: string;
  scripture_ref: string;
  line: string;
}

export const REFRAME_HELPS: ReframeHelp[] = [
  { theme: 'Worry', scripture_ref: 'Philippians 4:6-7', line: 'Hand the specific worry over in prayer, and let his peace guard you.' },
  { theme: 'Fear', scripture_ref: 'Isaiah 41:10', line: 'You are not facing this alone. He is holding you up.' },
  { theme: 'Shame', scripture_ref: 'Romans 8:1', line: 'There is no condemnation for you in Christ. The verdict is already love.' },
  { theme: 'Not enough', scripture_ref: '2 Corinthians 12:9', line: 'His grace is enough, and his strength shows up in your weakness.' },
  { theme: 'Anger', scripture_ref: 'James 1:19-20', line: 'Slow down. Be quick to listen and slow to anger.' },
  { theme: 'Discouraged', scripture_ref: 'Galatians 6:9', line: 'Do not give up. The harvest comes in its season.' },
  { theme: 'Lonely', scripture_ref: 'Deuteronomy 31:6', line: 'He will never leave you or forsake you.' },
  { theme: 'Comparison', scripture_ref: 'Galatians 6:4', line: 'Test your own work. Your road is yours, and it is enough.' },
];

export const REFRAME_STEPS: { key: 'situation' | 'thought' | 'reframe'; title: string; prompt: string }[] = [
  { key: 'situation', title: 'What happened', prompt: 'What set this off? Just the facts.' },
  { key: 'thought', title: 'The thought', prompt: 'What did you start telling yourself?' },
  { key: 'reframe', title: 'A truer word', prompt: 'What is a kinder, truer thing to say, in light of who God says you are?' },
];

/* ============================================================
   Prayer categories. Lives here (not in the prayer action file)
   because a "use server" module may only export async functions.
   ============================================================ */

export const PRAYER_CATEGORIES = [
  'general',
  'family',
  'health',
  'work',
  'church',
  'world',
] as const;

export type PrayerCategory = (typeof PRAYER_CATEGORIES)[number];
