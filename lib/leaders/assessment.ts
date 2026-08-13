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
   Part 1: the four gates.
   Answered "no", the assessment ends there. Nobody should spend
   thirty minutes on something that was never going to fit.
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
    // Covenant Section 2: church at least three times per month, serving at
    // least twice per month.
    id: 'gate_church',
    question:
      'Are you part of a local church, there at least three times a month and serving at least twice a month?',
    help:
      'FaithFlow does not replace the church and never will. A leader here is someone already planted somewhere, under real pastoral authority, not someone using this instead of a church.',
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
      'Some weeks it is Scripture. Some weeks it is a meal, a drive, a climb, a hard conversation. The commitment is to the people, not to the kind of evening. Persistent absence is handled through the correction process, not ignored.',
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
  /** Covenant section this comes from, shown to the applicant. */
  covenant?: string;
  /** Marked in the UI: a "no" here ends it, whatever else is true. */
  nonNegotiable?: boolean;
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
      text: '“His delight is in the law of the Lord. On his law he meditates day and night.”',
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
      text: '“Giving diligence to present yourself approved by God, rightly handling the Word of Truth.”',
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

/* ============================================================
   Part 3: the walk. Short honest answers, not pass or fail.
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
      text: '“His delight is in the law of the Lord.”',
    },
    minChars: 40,
  },
  {
    id: 'w_accountable_who',
    prompt: 'Who holds you accountable, and what do they actually know about you?',
    help: 'A name and a sentence. If nobody comes to mind, say that plainly.',
    scripture: {
      ref: 'James 5:16',
      text: '“Confess your offenses to one another, and pray for one another.”',
    },
    minChars: 30,
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
    minChars: 40,
  },
  {
    id: 'w_why_lead',
    prompt: 'Why do you want to lead?',
    help: 'Say the real reason, including any part of it you are not proud of.',
    scripture: {
      ref: 'Jeremiah 17:9',
      text: '“The heart is deceitful above all things. Who can know it?”',
    },
    minChars: 60,
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
    minChars: 30,
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
        '“Doesn’t he leave the ninety-nine and go after the one that was lost, until he found it?”',
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

/** Everything the form collects, for the server action and the storage shape. */
export interface AssessmentSubmission {
  name: string;
  email: string;
  phone: string;
  church: string;
  /** Covenant Section 13 and 14: a leader under 18 needs a guardian co-signature. */
  isMinor: boolean;
  guardianName: string;
  guardianEmail: string;
  gates: Record<string, boolean>;
  doctrine: Record<string, boolean>;
  commitments: Record<string, boolean>;
  walk: Record<string, string>;
  scenarios: Record<string, string>;
}
