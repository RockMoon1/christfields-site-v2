/**
 * The FaithFlow leader readiness assessment.
 *
 * This comes BEFORE the Leadership Covenant, never instead of it. The covenant
 * is walked through in person, given at least seven days before signing, and
 * prayed over. This is the honest conversation that decides whether that
 * walkthrough is worth booking.
 *
 * Every commitment below traces to a numbered section of
 * Christfields_Leadership_Covenant.pdf, so nobody is asked to agree here to
 * something they will not be asked to sign there, and nothing in the covenant
 * arrives as a surprise at the table. Section references are in the comments.
 *
 * The scoring rubric deliberately lives in docs/LEADER-ASSESSMENT.md and NEVER
 * in this file: anything imported by the form is shipped to the applicant's
 * browser, and someone who can read what you are looking for can write it back
 * to you.
 *
 * Scripture is quoted from the World English Bible (public domain), so the page
 * carries no licensing obligation. Where the covenant cites a passage for a
 * commitment, the same passage is used here.
 */

export interface Scripture {
  ref: string;
  text: string;
}

/* ============================================================
   Part 1: the gates.
   Answered "no", the assessment ends there. Nobody should spend
   thirty minutes on something that was never going to fit.

   Four things gate this form: the three below, and the doctrinal
   affirmation that follows them, which ends the form the same way
   when someone says they cannot affirm it.
   ============================================================ */

export interface GateQuestion {
  id: string;
  question: string;
  /** What we mean by it, so nobody answers yes to the wrong thing. */
  help: string;
  scripture: Scripture;
}

export const GATES: GateQuestion[] = [
  {
    // Covenant Section 2: personal faith and spiritual life.
    id: 'gate_follower',
    question: 'Are you a follower of Jesus Christ?',
    help:
      'Not the label, and not the culture around it. Have you actually surrendered your life to him, and are you following him today, in the parts of your life nobody sees?',
    scripture: {
      ref: 'Luke 6:46',
      text: '“Why do you call me, ‘Lord, Lord,’ and don’t do the things which I say?”',
    },
  },
  {
    // Covenant Section 2. Deliberately split from the three-times-a-month and
    // serving-twice-a-month figures, which the covenant states as forward
    // commitments ("I will attend...", "I will serve...") rather than as a test
    // of this month. Being planted somewhere is the disqualifier; a schedule
    // someone could start next week is not, so it is asked as a commitment.
    id: 'gate_church',
    question: 'Are you part of a local church, under real pastoral authority?',
    help:
      'FaithFlow does not replace the church and never will. A leader here is someone already planted somewhere, with people who know them and can speak to how they live, not someone using this instead of a church.',
    scripture: {
      ref: 'Hebrews 10:24-25',
      text:
        '“Let’s consider how to provoke one another to love and good works, not forsaking our own assembling together.”',
    },
  },
  {
    // Covenant Section 5: attend the named gatherings at least twice per week.
    id: 'gate_twice_weekly',
    question:
      'Will you be at the named gatherings twice a week, whatever the activity is that week?',
    help:
      'Some weeks it is Scripture. Some weeks it is a meal, a drive, a climb, a hard conversation. The commitment is to the people, not to the kind of evening. Persistent absence is handled through the correction process, not ignored. If the only thing in the way is a ride, that is not a no — say yes and tell us, because we can usually solve a ride.',
    scripture: {
      ref: 'Psalm 15:4',
      text: '“He who keeps an oath even when it hurts, and doesn’t change.”',
    },
  },
];

/* ============================================================
   The doctrinal gate. All must be affirmed.

   Covenant Section 1 requires agreement with the Statement of
   Faith. That document is still an unfilled appendix, so what
   follows is the historic core the whole church has confessed,
   deliberately not this community's distinctives: the long-term
   aim is a leadership credential another church would honor, and
   that only works if what is affirmed is what everyone confesses.
   ============================================================ */

export interface DoctrineItem {
  id: string;
  statement: string;
  scripture: Scripture;
}

export const DOCTRINE: DoctrineItem[] = [
  {
    id: 'doc_scripture',
    statement:
      'The Bible is the inspired Word of God, and the final authority for what I believe and how I live.',
    scripture: {
      ref: '2 Timothy 3:16',
      text:
        '“Every Scripture is God-breathed and profitable for teaching, for reproof, for correction, and for instruction in righteousness.”',
    },
  },
  {
    id: 'doc_trinity',
    statement: 'There is one God, eternally existing as Father, Son, and Holy Spirit.',
    scripture: {
      ref: 'Matthew 28:19',
      text: '“Baptizing them in the name of the Father and of the Son and of the Holy Spirit.”',
    },
  },
  {
    id: 'doc_christ',
    statement: 'Jesus Christ is fully God and fully man, and he lived a sinless life.',
    scripture: {
      ref: 'John 1:14',
      text: '“The Word became flesh, and lived among us.”',
    },
  },
  {
    id: 'doc_cross',
    statement: 'Jesus died for our sins and rose bodily from the dead.',
    scripture: {
      ref: '1 Corinthians 15:3-4',
      text:
        '“Christ died for our sins according to the Scriptures, that he was buried, that he was raised on the third day.”',
    },
  },
  {
    id: 'doc_grace',
    statement:
      'Salvation is by grace, through faith in Christ alone, and not something I earn.',
    scripture: {
      ref: 'Ephesians 2:8-9',
      text:
        '“For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works.”',
    },
  },
  {
    id: 'doc_return',
    statement: 'Jesus Christ will return.',
    scripture: {
      ref: 'Acts 1:11',
      text:
        '“This Jesus, who was received up from you into the sky, will come back in the same way as you saw him going.”',
    },
  },
  {
    id: 'doc_church',
    statement:
      'The Church is the body of Christ, and believers are meant to belong to one another, not to follow him alone.',
    scripture: {
      ref: '1 Corinthians 12:27',
      text: '“Now you are the body of Christ, and members individually.”',
    },
  },
  {
    // Covenant Section 1, third bullet.
    id: 'doc_report_change',
    statement:
      'If my beliefs ever change so that I can no longer affirm this, I will say so promptly rather than keep leading and teaching against it.',
    scripture: {
      ref: 'Titus 1:9',
      text:
        '“Holding to the faithful word which is according to the teaching, that he may be able to exhort in the sound doctrine.”',
    },
  },
];

/* ============================================================
   Part 2: the commitments. Plain yes or no.
   Ordered so the non-negotiables come first.
   ============================================================ */

export interface YesNoQuestion {
  id: string;
  question: string;
  help?: string;
  scripture: Scripture;
  /** A second passage, where the covenant pairs two and both are needed. */
  alsoScripture?: Scripture;
  /** Covenant section this comes from, shown to the applicant. */
  covenant?: string;
  /** Marked in the UI: a "no" here ends it, whatever else is true. */
  nonNegotiable?: boolean;
  /** Only asked of applicants under 18, and only counted for them. */
  minorOnly?: boolean;
}

export const COMMITMENTS: YesNoQuestion[] = [
  // ---- Section 14: youth protection. Non-negotiable. ----
  {
    id: 'c_never_alone_minor',
    question:
      'Will you never be alone one on one with a minor out of sight of others, in any room, vehicle, or private setting?',
    help:
      'Open, observable places, with at least two screened, unrelated leaders present. This protects the young person and it protects you from ever having to defend your intentions.',
    covenant: 'Section 14',
    nonNegotiable: true,
    scripture: {
      ref: 'Romans 12:17',
      text: '“Respect what is honorable in the sight of all men.”',
    },
  },
  {
    id: 'c_minor_channels',
    question:
      'Will you keep all messaging with a minor in group channels or with a parent or second leader included, never private one to one?',
    covenant: 'Section 14',
    nonNegotiable: true,
    scripture: {
      ref: 'Ephesians 5:15-16',
      text: '“Therefore watch carefully how you walk, not as unwise, but as wise.”',
    },
  },
  {
    id: 'c_report_abuse',
    question:
      'If you learn of or reasonably suspect abuse or neglect of a minor, will you report it immediately to the Colorado hotline (1-844-264-5437), or 911 if there is immediate danger, and then tell the Table?',
    help:
      'Telling the Table never replaces the report to authorities, and no leader may ever tell another leader not to report. Confidence protects people. It never protects harm.',
    covenant: 'Section 14',
    nonNegotiable: true,
    scripture: {
      ref: 'Proverbs 24:11',
      text: '“Rescue those who are being led away to death.”',
    },
  },
  {
    // Covenant Section 14, second bullet. Asked of the person it actually
    // governs: the guardian is told this and the applicant is shown it as a
    // reassurance, but until now the young leader was never asked to affirm it.
    id: 'c_minor_under_adult',
    question:
      'Will you serve under a screened adult, and never take sole responsibility for a group?',
    help:
      'This is the rule that makes leading under 18 possible at all. You are never the only leader in the room, and you are never the one left holding it. "Screened" means a background check and references, renewed, before that adult is ever alone in a room with young people.',
    covenant: 'Section 14',
    nonNegotiable: true,
    minorOnly: true,
    scripture: {
      ref: '1 Timothy 4:12',
      text:
        '“Let no man despise your youth; but be an example to those who believe, in word, in your way of life, in love, in spirit, in faith, in purity.”',
    },
  },
  // ---- Section 3: one-on-one boundaries. Non-negotiable. ----
  {
    id: 'c_opposite_sex',
    question:
      'Will you avoid meeting alone with, or carrying on private emotionally deep conversations with, someone of the opposite sex in this role?',
    help:
      'Meetings happen in public, observable settings or with a second leader. A care conversation of that kind is referred to a leader of the same sex or held with a second leader present. This applies regardless of intent, maturity, or how trusted either person is.',
    covenant: 'Section 3',
    nonNegotiable: true,
    scripture: {
      ref: '1 Timothy 5:1-2',
      text: '“The younger women as sisters, in all purity.”',
    },
  },
  // ---- Section 2: daily faith. ----
  {
    // The half of Section 2 the gate deliberately does not test. Stated the way
    // the covenant states it, as something you will do, not something you have
    // already been doing.
    id: 'c_church_rhythm',
    question:
      'Will you be at your church at least three times a month, and serving there at least twice a month?',
    help:
      'Your own church, not this. If you are between churches or newly moved, say no here and tell us about it later; it is a conversation, not a door.',
    covenant: 'Section 2',
    scripture: {
      ref: 'Hebrews 10:24-25',
      text:
        '“Not forsaking our own assembling together, as the custom of some is, but exhorting one another.”',
    },
  },
  {
    id: 'c_pray_daily',
    question: 'Will you pray daily, as the first priority?',
    covenant: 'Section 2',
    scripture: {
      ref: '1 Thessalonians 5:17',
      text: '“Pray without ceasing.”',
    },
  },
  {
    id: 'c_scripture_daily',
    question: 'Will you read Scripture daily?',
    help: 'Not only when preparing something for other people.',
    covenant: 'Section 2',
    scripture: {
      ref: 'Psalm 1:2',
      text: '“His delight is in Yahweh’s law. On his law he meditates day and night.”',
    },
  },
  // ---- Section 5 and 6: role, pairs, the Table. ----
  {
    id: 'c_co_leader',
    question:
      'Are you willing to lead alongside a co-leader, never alone, and to tell them early when you cannot fulfill something?',
    help: 'Every group here is led by two. That is the design, not a fallback.',
    covenant: 'Sections 5 and 6',
    scripture: {
      ref: 'Mark 6:7',
      text: '“He called to himself the twelve, and began to send them out two by two.”',
    },
  },
  {
    id: 'c_submit_table',
    question:
      'Will you submit to the decisions of the Table, except where a decision would require you to act against Scripture?',
    help:
      'And will you raise disagreement directly, first to your co-leader and then to the Table, rather than through division?',
    covenant: 'Section 6',
    scripture: {
      ref: 'Hebrews 13:17',
      text: '“Obey your leaders and submit to them, for they watch on behalf of your souls.”',
    },
    // The covenant pairs these two, and the second is the whole reason the
    // exception in the question is real. Shown together or the escape clause
    // sits under a proof text pointing the other way.
    alsoScripture: {
      ref: 'Acts 5:29',
      text: '“We must obey God rather than men.”',
    },
  },
  {
    id: 'c_correction',
    question:
      'Do you accept the correction process, and that you will not step down purely to escape one already underway?',
    help:
      'It follows Matthew 18 and it aims at restoration, not punishment. You remain free to step down at any time; doing so mid-process simply does not end the process.',
    covenant: 'Section 7',
    scripture: {
      ref: 'Galatians 6:1',
      text: '“Restore such a one in a spirit of gentleness, looking to yourself so that you also aren’t tempted.”',
    },
  },
  {
    id: 'c_confidence',
    question: 'Will you protect what is shared with you in this role?',
    covenant: 'Section 8',
    scripture: {
      ref: 'Proverbs 11:13',
      text:
        '“One who brings gossip betrays a confidence, but one who is of a trustworthy spirit keeps a secret.”',
    },
  },
  {
    id: 'c_content_review',
    question:
      'Will you verify every Scripture you publish, and put content through the ministry review process before it goes out under the ministry name?',
    covenant: 'Section 4',
    scripture: {
      ref: '2 Timothy 2:15',
      text: '“Give diligence to present yourself approved by God, properly handling the Word of Truth.”',
    },
  },
  {
    // Covenant Section 9. A property commitment, and exactly the kind of clause
    // people are surprised by at a signing table, so it is said here first.
    id: 'c_content_ownership',
    question:
      'Do you understand that anything you make for the ministry in this role belongs to the ministry, and that you hand back accounts and materials when you step away?',
    help:
      'Studies, graphics, group accounts, photos taken in the role. It is not about your own work or your own words elsewhere, and stepping away is never held against you.',
    covenant: 'Section 9',
    scripture: {
      ref: '1 Chronicles 29:14',
      text: '“For all things come from you, and of your own have we given you.”',
    },
  },
  {
    id: 'c_above_reproach',
    question:
      'Will you pursue a life above reproach in your speech, integrity, sexual conduct, money, and use of authority?',
    covenant: 'Section 3',
    scripture: {
      ref: '1 Timothy 3:2',
      text: '“The overseer therefore must be without reproach.”',
    },
  },
  {
    id: 'c_screening',
    question:
      'Are you willing to complete the ministry screening for this role, and to have it renewed?',
    covenant: 'Section 14',
    scripture: {
      ref: 'Luke 16:10',
      text: '“He who is faithful in a very little is faithful also in much.”',
    },
  },
  // ---- Heart-level, beyond the covenant's letter. ----
  {
    id: 'c_accountable',
    question:
      'Is there someone in your life right now who can tell you that you are wrong, and you will listen?',
    help: 'Name them later in this form. A leader with no one over them is not accountable, whatever they say.',
    scripture: {
      ref: 'Proverbs 27:17',
      text: '“Iron sharpens iron; so a man sharpens his friend’s countenance.”',
    },
  },
  {
    id: 'c_private_matches_public',
    question:
      'Does your private life match what people would assume from your public one?',
    help:
      'Nobody is asking for perfection. This asks whether you are hiding something that would change how people see you if they knew.',
    scripture: {
      ref: 'Luke 8:17',
      text: '“For nothing is hidden that will not be revealed.”',
    },
  },
  {
    id: 'c_not_status',
    question:
      'Are you willing to lead with no title, no platform, and no one outside the group ever knowing you did it?',
    scripture: {
      ref: 'Matthew 6:1',
      text:
        '“Be careful that you don’t do your charitable giving before men, to be seen by them.”',
    },
  },
  {
    id: 'c_correctable',
    question:
      'If the Table came to you and said this is not your season to lead, could you receive that without resentment?',
    scripture: {
      ref: 'James 4:10',
      text: '“Humble yourselves in the sight of the Lord, and he will exalt you.”',
    },
  },
];

/** The commitments that apply to this applicant. Minor-only items are asked of,
 *  and counted for, nobody else. */
export function commitmentsFor(isMinor: boolean): YesNoQuestion[] {
  return COMMITMENTS.filter((c) => !c.minorOnly || isMinor);
}

/* ============================================================
   Part 3: the walk. Short honest answers, not pass or fail.

   The minimums here are floors against a blank box, not a
   standard. w_accountable_who tells people to say plainly if
   nobody comes to mind, and "nobody, honestly" has to be an
   answer the form accepts, or the page is asking for length
   while claiming to ask for truth.
   ============================================================ */

export interface OpenQuestion {
  id: string;
  prompt: string;
  help?: string;
  placeholder?: string;
  scripture?: Scripture;
  minChars: number;
}

export const WALK: OpenQuestion[] = [
  {
    id: 'w_scripture_rhythm',
    prompt: 'What do your daily prayer and Scripture actually look like right now?',
    help: 'Not what you wish they looked like. What this past week actually held.',
    placeholder: 'An honest small answer is worth more here than an impressive one.',
    scripture: {
      ref: 'Psalm 1:2',
      text: '“His delight is in Yahweh’s law. On his law he meditates day and night.”',
    },
    minChars: 20,
  },
  {
    id: 'w_accountable_who',
    prompt: 'Who holds you accountable, and what do they actually know about you?',
    help: 'A name and a sentence. If nobody comes to mind, say that plainly.',
    scripture: {
      ref: 'James 5:16',
      text: '“Confess your offenses to one another, and pray for one another.”',
    },
    minChars: 12,
  },
  {
    id: 'w_current_struggle',
    prompt: 'What are you struggling with right now?',
    help:
      'This is not a trap and it is not disqualifying. A leader who cannot name anything is the one we would worry about.',
    scripture: {
      ref: '2 Corinthians 12:9',
      text: '“My grace is sufficient for you, for my power is made perfect in weakness.”',
    },
    minChars: 12,
  },
  {
    id: 'w_why_lead',
    prompt: 'Why do you want to lead?',
    help: 'Say the real reason, including any part of it you are not proud of.',
    scripture: {
      ref: 'Jeremiah 17:9',
      text: '“The heart is deceitful above all things. Who can know it?”',
    },
    minChars: 30,
  },
  {
    id: 'w_who_suggested',
    prompt: 'Who else has told you that you would be good at this, and why?',
    help:
      'Leadership only you can see in yourself is worth a second look. We are asking whether anyone outside your own head has noticed it.',
    scripture: {
      ref: '1 Timothy 3:7',
      text: '“He must have good testimony from those who are outside.”',
    },
    minChars: 12,
  },
];

/* ============================================================
   Part 4: scenarios. How someone actually thinks, in the moment.
   ============================================================ */

export interface ScenarioQuestion {
  id: string;
  title: string;
  situation: string;
  ask: string;
  /**
   * Asked instead of `ask` when the applicant is under 18.
   *
   * Some of these scenarios put the applicant in the chair of the responsible
   * adult. A minor leader is barred by `c_minor_under_adult` from ever holding
   * that room alone, so asking them to answer as the adult grades them on a
   * judgment they are structurally forbidden to make. The minor version asks
   * for the reflex they actually need: who do you go get, and how fast.
   */
  askMinor?: string;
  scripture: Scripture;
  minChars: number;
}

export const SCENARIOS: ScenarioQuestion[] = [
  {
    id: 's_airpods',
    title: 'The one having a bad night',
    situation:
      'A student in your group is being difficult all evening. Short with people, dismissive, refusing to join in. Partway through you find out he lost his AirPods earlier that day. You also know enough about his home to know nobody ever taught him what to do with frustration, and that this is how it comes out.',
    ask:
      'Walk us through your evening, step by step. What do you do in the moment, what do you not do, and what happens after everyone leaves?',
    scripture: {
      ref: 'James 1:19',
      text: '“Let every man be swift to hear, slow to speak, and slow to anger.”',
    },
    minChars: 200,
  },
  {
    id: 's_disclosure',
    title: 'Something you were not ready for',
    situation:
      'After the group, one of your people stays behind. They tell you something heavy, and they start with “please do not tell anyone.” As they talk, it becomes clear they are thinking about hurting themselves. They are fifteen.',
    ask:
      'What do you say to them in that moment, and what do you do in the next hour? Be specific about who you contact.',
    askMinor:
      'What do you say to them in that moment? Then: who do you go and get, and how fast? You are never the only one holding this, and we want to know that you know that.',
    scripture: {
      ref: 'Galatians 6:2',
      text: '“Bear one another’s burdens, and so fulfill the law of Christ.”',
    },
    minChars: 150,
  },
  {
    id: 's_boundary',
    title: 'The request that sounds reasonable',
    situation:
      'A member of the opposite sex asks to meet with you one on one to talk through something painful. They are upset, they trust you, and they specifically do not want anyone else there. Nothing about their request is manipulative. They just want help.',
    ask: 'What do you do, and what do you say to them?',
    scripture: {
      ref: 'Proverbs 27:12',
      text: '“A prudent man sees danger and takes refuge; but the simple pass on, and suffer for it.”',
    },
    minChars: 150,
  },
  {
    id: 's_co_leader',
    title: 'When you and your co-leader disagree',
    situation:
      'Your co-leader handled something in a way you think was wrong. It was not sin, but you would have done it differently and you think it hurt someone.',
    ask: 'What do you do, and in what order?',
    scripture: {
      ref: 'Matthew 18:15',
      text:
        '“Go, show him his fault between you and him alone. If he listens to you, you have gained back your brother.”',
    },
    minChars: 150,
  },
  {
    id: 's_drifting',
    title: 'The one who stopped coming',
    situation:
      'Someone who used to come every week has now missed three in a row. They are reading your messages and not answering.',
    ask: 'What do you do, and how long do you keep doing it?',
    scripture: {
      ref: 'Luke 15:4',
      text:
        '“…wouldn’t leave the ninety-nine in the wilderness, and go after the one that was lost, until he found it?”',
    },
    minChars: 120,
  },
  {
    id: 's_dont_know',
    title: 'The question you cannot answer',
    situation:
      'In the middle of a study, someone asks you a direct question about the Bible and you genuinely do not know the answer. Everyone is looking at you.',
    ask: 'What do you say?',
    scripture: {
      ref: 'Proverbs 12:15',
      text: '“The way of a fool is right in his own eyes, but he who is wise listens to counsel.”',
    },
    minChars: 80,
  },
  {
    id: 's_empty',
    title: 'The week you have nothing left',
    situation:
      'It is the night your group meets. You are exhausted, something hard is happening in your own life, and you have nothing to give anyone.',
    ask: 'What do you actually do?',
    scripture: {
      ref: 'Matthew 11:28',
      text: '“Come to me, all you who labor and are heavily burdened, and I will give you rest.”',
    },
    minChars: 120,
  },
];

/**
 * Shown wherever this form asks someone to sit with something heavy.
 *
 * The assessment walks an applicant, who may themselves be fifteen, through a
 * vignette about a fifteen-year-old thinking of hurting themselves, and two
 * steps earlier asks them to name what they are struggling with right now. To
 * do that and then say "thank you" with no help offered would be indefensible.
 * Kept small and calm rather than a banner: it should read as a door left open,
 * not as an alarm about the person reading it.
 */
export const CRISIS_LINE = {
  lead: 'If any of this is close to home for you right now, call or text',
  body:
    '. It is free, it is answered any hour of the day, and you do not have to be in crisis to use it.',
};

/** The questions heavy enough to carry it. */
export const CRISIS_LINE_IDS = ['w_current_struggle', 's_disclosure'];

/**
 * The written answers an under-18 applicant can choose to keep from their
 * parent. Everything defaults to shared.
 *
 * A switch does three things and no more: it decides what a person here may
 * pass on to the guardian AFTER reading it (nothing is ever forwarded
 * automatically), it never hides anything from the Table, and it never
 * overrides the duty to act when a young person may not be safe. All three are
 * said plainly on the form, because a privacy control that quietly means less
 * than it appears to would be worse than having none.
 */
export const SHAREABLE_IDS: string[] = [
  ...WALK.map((w) => w.id),
  ...SCENARIOS.map((s) => s.id),
];

/** Everything the form collects, for the server action and the storage shape. */
export interface AssessmentSubmission {
  name: string;
  email: string;
  phone: string;
  church: string;
  /** Honeypot. Always empty from a person; a filled value means a script. */
  website: string;
  /** Covenant Section 13 and 14: a leader under 18 needs a guardian co-signature. */
  isMinor: boolean;
  guardianName: string;
  guardianEmail: string;
  gates: Record<string, boolean>;
  doctrine: Record<string, boolean>;
  commitments: Record<string, boolean>;
  walk: Record<string, string>;
  scenarios: Record<string, string>;
  /** Per-answer: may this appear in the guardian's email? Defaults to true. */
  visibility: Record<string, boolean>;
}
