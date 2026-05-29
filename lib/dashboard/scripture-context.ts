/**
 * Verse-in-context notes for the daily-verse pool.
 *
 * The point is sound hermeneutics in a simple, mobile-friendly form: every
 * verse meets the reader WITH its setting (who wrote it, to whom, and what was
 * happening) and a short "in its place" note, so a verse is never torn from its
 * passage and turned into a slogan. Cross-references show how the thread runs
 * through the whole of Scripture, not a single line.
 *
 * This is original, authored prose plus plain Scripture REFERENCES (which carry
 * no copyright). We deliberately do NOT reprint long passages of a copyrighted
 * translation; instead the UI links out to read the full chapter in context.
 *
 * Authority order, kept honest: this is Scripture first. Any psychology or
 * science elsewhere in the app is a supportive lens under it, never over it.
 */

export interface VerseContext {
  /** Who wrote it, to whom, and the situation. Plain background. */
  setting: string;
  /** What is happening around the verse, so it is read in its place. */
  inContext: string;
  /** A couple of threads elsewhere in Scripture. References only. */
  crossRefs: { ref: string; note: string }[];
}

/**
 * Keyed by the exact reference in VERSES_OF_DAY. A reference with no entry falls
 * back to a gentle "read the whole chapter" prompt in the UI.
 */
export const VERSE_CONTEXT: Record<string, VerseContext> = {
  'Lamentations 3:22-23': {
    setting:
      'Jeremiah writes Lamentations grieving over Jerusalem after it was destroyed and its people carried off. This is poetry written from rubble, not from comfort.',
    inContext:
      'These famous lines about new mercies sit in the exact middle of the saddest book in the Bible. Hope here is not denial of the pain; it is a defiant turn toward God in the thick of it.',
    crossRefs: [
      { ref: 'Psalm 30:5', note: 'Weeping may stay the night, joy comes in the morning.' },
      { ref: 'Romans 8:38-39', note: 'Nothing can separate us from his love.' },
    ],
  },
  'Psalm 46:10': {
    setting:
      'A psalm of the sons of Korah, sung when nations and kingdoms were in uproar. "Be still" is spoken into chaos, not calm.',
    inContext:
      '"Be still" is less "relax" and more "stop striving, lay down your arms." It is God telling a frightened people to stop and know that he, not their panic, is in control.',
    crossRefs: [
      { ref: 'Exodus 14:14', note: 'The Lord will fight for you; you need only be still.' },
      { ref: 'Psalm 46:1', note: 'God is our refuge and strength, a very present help.' },
    ],
  },
  'Philippians 4:6-7': {
    setting:
      'Paul writes to the church at Philippi from prison, facing a possible death sentence, and still talks about joy and peace.',
    inContext:
      'The call not to be anxious comes from a man in chains. The peace promised is not a feeling he worked up; it is a guard God posts over the heart of someone who has handed him the worry.',
    crossRefs: [
      { ref: '1 Peter 5:7', note: 'Cast all your anxiety on him, because he cares for you.' },
      { ref: 'Matthew 6:25-34', note: 'Do not be anxious; your Father knows what you need.' },
    ],
  },
  'Proverbs 3:5-6': {
    setting:
      'Part of a father’s wisdom to his son in Proverbs, teaching how to live well under God before the hard choices come.',
    inContext:
      'Trusting God "with all your heart" is set directly against leaning on your own understanding. It is not anti-thinking; it is refusing to make your own read of things the final word.',
    crossRefs: [
      { ref: 'Jeremiah 17:7-8', note: 'Blessed is the one who trusts in the Lord.' },
      { ref: 'James 1:5', note: 'Ask God for wisdom; he gives generously.' },
    ],
  },
  'Matthew 11:28': {
    setting:
      'Jesus speaks to ordinary people worn out by the heavy religious demands of their day.',
    inContext:
      'The "rest" is the opposite of the crushing load the religious leaders piled on. He offers a different yoke, his own, which is easy. Rest here is a Person to come to, not a technique.',
    crossRefs: [
      { ref: 'Matthew 11:29-30', note: 'My yoke is easy and my burden is light.' },
      { ref: 'Hebrews 4:9-10', note: 'There remains a Sabbath rest for the people of God.' },
    ],
  },
  'Isaiah 40:31': {
    setting:
      'Isaiah writes to a people facing exile, weary and afraid they have been forgotten by God.',
    inContext:
      'The promise of renewed strength answers a specific complaint two verses earlier: "my way is hidden from the Lord." Waiting on God is the cure offered to the exhausted, not the strong.',
    crossRefs: [
      { ref: 'Isaiah 40:27-28', note: 'The everlasting God does not faint or grow weary.' },
      { ref: '2 Corinthians 4:16', note: 'Though the body wastes away, we are renewed daily.' },
    ],
  },
  'Romans 8:1': {
    setting:
      'Paul writes to Rome right after a raw chapter about his own ongoing struggle with sin (Romans 7).',
    inContext:
      '"No condemnation" lands on the heels of "what a wretched man I am." It is not for people who have it together; it is the verdict over those still in the fight, because they are in Christ.',
    crossRefs: [
      { ref: 'Romans 7:24-25', note: 'Who will rescue me? Thanks be to God through Christ.' },
      { ref: 'John 3:17', note: 'God sent his Son not to condemn the world but to save it.' },
    ],
  },
  'Psalm 23:1': {
    setting:
      'David, who was a shepherd before he was a king, writes of God as his own shepherd.',
    inContext:
      '"I shall not want" is the confidence of a sheep that knows its shepherd, written by a man who had been hunted and had lost much. The psalm walks through the valley, not around it.',
    crossRefs: [
      { ref: 'John 10:11', note: 'I am the good shepherd who lays down his life.' },
      { ref: 'Psalm 23:4', note: 'Even through the valley, I will fear no evil.' },
    ],
  },
  'Joshua 1:9': {
    setting:
      'God speaks to Joshua just after Moses has died, as Joshua takes up leading a whole nation into an unknown land.',
    inContext:
      'The command to be courageous is repeated because the task was genuinely frightening. The ground of the courage is not Joshua’s nerve but a promise: "the Lord your God is with you."',
    crossRefs: [
      { ref: 'Deuteronomy 31:6', note: 'He will never leave you or forsake you.' },
      { ref: 'Matthew 28:20', note: 'I am with you always, to the end of the age.' },
    ],
  },
  'Psalm 119:105': {
    setting:
      'Psalm 119 is the longest chapter in the Bible, a long love song to God’s word in a dark and uncertain time.',
    inContext:
      'A lamp and a light give just enough to take the next step, not a floodlit view of the whole road. The verse assumes you are walking in the dark and need the Word for the step in front of you.',
    crossRefs: [
      { ref: '2 Timothy 3:16-17', note: 'All Scripture is God-breathed and useful.' },
      { ref: 'Psalm 119:11', note: 'I have hidden your word in my heart.' },
    ],
  },
  'Isaiah 41:10': {
    setting: 'God reassures Israel, his chosen people, when they feel small and threatened by larger nations.',
    inContext:
      '"Fear not" is grounded four times over: I am with you, I am your God, I will strengthen you, I will uphold you. The comfort is not "cheer up" but "I am holding you."',
    crossRefs: [
      { ref: 'Isaiah 43:1-2', note: 'When you pass through the waters, I will be with you.' },
      { ref: 'Romans 8:31', note: 'If God is for us, who can be against us?' },
    ],
  },
  '2 Corinthians 12:9': {
    setting:
      'Paul has begged God three times to remove a painful "thorn in the flesh," and God says no.',
    inContext:
      'This is God’s answer to an unanswered prayer. Grace being "sufficient" is what Paul is given INSTEAD of relief, and he learns to boast in weakness rather than resent it.',
    crossRefs: [
      { ref: '2 Corinthians 12:7-8', note: 'The thorn, and Paul pleading for it to leave.' },
      { ref: 'Philippians 4:11-13', note: 'Learning to be content in any circumstance.' },
    ],
  },
  'Galatians 6:9': {
    setting: 'Paul writes to churches in Galatia about the long, ordinary work of doing good to others.',
    inContext:
      'The encouragement not to grow weary assumes you are tired. "In due season" admits the harvest is delayed; the verse is for the stretch where doing good feels pointless.',
    crossRefs: [
      { ref: 'Galatians 6:10', note: 'So then, do good to everyone, especially the household of faith.' },
      { ref: '1 Corinthians 15:58', note: 'Your labor in the Lord is not in vain.' },
    ],
  },
  'Psalm 34:18': {
    setting:
      'David wrote this after escaping a king by pretending to be insane, a low and undignified moment.',
    inContext:
      'God being "near the brokenhearted" is written by someone who had just been exactly that. It is not a tidy promise from the mountaintop but a word from the floor.',
    crossRefs: [
      { ref: 'Psalm 51:17', note: 'A broken and contrite heart God will not despise.' },
      { ref: 'Matthew 5:4', note: 'Blessed are those who mourn, for they will be comforted.' },
    ],
  },
  'Zephaniah 3:17': {
    setting:
      'Zephaniah spends most of his short book on warning and judgment, then turns, near the end, to restoration.',
    inContext:
      'This tender picture of God singing over his people comes right after pages of hard words. It is the dawn after the night, which is what makes it so striking in its place.',
    crossRefs: [
      { ref: 'Luke 15:7', note: 'Joy in heaven over one sinner who repents.' },
      { ref: 'Isaiah 62:5', note: 'As a bridegroom rejoices, so will your God rejoice over you.' },
    ],
  },
  'Matthew 6:34': {
    setting: 'Part of Jesus’ Sermon on the Mount, teaching a crowd how life works in God’s kingdom.',
    inContext:
      'The verse closes a whole section on worry, where Jesus points to birds and flowers under the Father’s care. "Do not worry about tomorrow" rests on "your Father knows what you need."',
    crossRefs: [
      { ref: 'Matthew 6:31-33', note: 'Seek first the kingdom, and these things are added.' },
      { ref: 'Proverbs 27:1', note: 'Do not boast about tomorrow; you do not know the day.' },
    ],
  },
  'Philippians 4:13': {
    setting:
      'Paul writes this from prison, having just said he has learned to be content whether well-fed or hungry, in plenty or in need.',
    inContext:
      'This is the most misquoted verse in the Bible. In context it is NOT "I can achieve anything." It is "I can endure any circumstance, full or empty, through Christ who strengthens me." It is about contentment, not triumph.',
    crossRefs: [
      { ref: 'Philippians 4:11-12', note: 'The secret of being content in any and every situation.' },
      { ref: '2 Corinthians 12:9-10', note: 'When I am weak, then I am strong.' },
    ],
  },
  'Psalm 143:8': {
    setting: 'David prays this while being pursued and overwhelmed, his spirit "faint" within him.',
    inContext:
      'Asking to "hear of your steadfast love in the morning" is the prayer of someone who had a hard night. It is trust spoken in the dark, before the rescue has come.',
    crossRefs: [
      { ref: 'Lamentations 3:22-23', note: 'His mercies are new every morning.' },
      { ref: 'Psalm 5:3', note: 'In the morning I lay my requests before you and wait.' },
    ],
  },
  '1 Thessalonians 5:11': {
    setting:
      'Paul writes to a young church facing hardship and grief, teaching them how to hold each other up.',
    inContext:
      'Encouraging "one another" is a command to a community, not a solo task. The verse assumes you are doing life close enough to other people to actually build them up.',
    crossRefs: [
      { ref: 'Hebrews 10:24-25', note: 'Spur one another on; do not give up meeting together.' },
      { ref: 'Galatians 6:2', note: 'Carry each other’s burdens.' },
    ],
  },
  'Proverbs 27:17': {
    setting: 'A proverb of Solomon about the effect close friends have on each other over time.',
    inContext:
      'Iron sharpening iron involves friction and sparks, not comfort. The picture is of honest, sometimes uncomfortable friendship that makes both people sharper. This is the verse Christ Fields is built on.',
    crossRefs: [
      { ref: 'Proverbs 27:6', note: 'Faithful are the wounds of a friend.' },
      { ref: 'Ecclesiastes 4:9-10', note: 'Two are better than one; one lifts the other up.' },
    ],
  },
};

/** Lookup with a safe miss (the UI shows a gentle read-the-chapter fallback). */
export function verseContextFor(reference: string): VerseContext | null {
  return VERSE_CONTEXT[reference] ?? null;
}
