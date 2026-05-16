/**
 * Tailored content shown after a FaithFlow form submission, by dropdown choice.
 * Each option produces a self-contained "mini-page" so the user gets the full
 * FaithFlow story in one place without having to scroll back through the site.
 *
 * Ported from the v1 faithflow.html FAITHFLOW_CONTENT object. The same shape
 * gets rendered by GetInvolved.tsx into the success card after submission.
 */

export type SectionType = 'prose' | 'list' | 'scriptures' | 'resources';

export interface ProseSection {
  type: 'prose';
  heading: string;
  paragraphs: string[];
}

export interface ListSection {
  type: 'list';
  heading: string;
  items: string[];
}

export interface ScriptureItem {
  ref: string;
  text: string;
}

export interface ScriptureSection {
  type: 'scriptures';
  heading: string;
  items: ScriptureItem[];
}

export interface ResourceItem {
  name: string;
  desc: string;
  url: string;
}

export interface ResourceSection {
  type: 'resources';
  heading: string;
  intro?: string;
  items: ResourceItem[];
}

export type ContentSection = ProseSection | ListSection | ScriptureSection | ResourceSection;

export interface TailoredContent {
  eyebrow: string;
  title: string;
  sections: ContentSection[];
}

export type InterestKey = 'community' | 'future-group' | 'help-start' | 'learn-more';

export const FAITHFLOW_CONTENT: Record<InterestKey, TailoredContent> = {
  community: {
    eyebrow: 'You Asked About',
    title: 'FaithFlow Community',
    sections: [
      {
        type: 'prose',
        heading: 'What FaithFlow Is',
        paragraphs: [
          'FaithFlow is not an app, a brand, or an online group. It is the Christ Fields community framework for real people walking together in Christ. Scripture-rooted, in-person, and honest.',
          'It is built on a simple truth: <em>you do not grow alone.</em> Accountability, friendship, and faithful community are essential to following Christ.',
          'FaithFlow creates space for people to gather in small groups, study Scripture together, walk through life’s challenges with honesty, and sharpen each other in faith and discipline.',
        ],
      },
      {
        type: 'prose',
        heading: 'Iron and Ember, Our First Group',
        paragraphs: [
          'Iron and Ember is the first active FaithFlow group and serves as an early model for what future groups may become. A small group of friends meeting in person in Colorado, walking through faith and life together, rooted in Proverbs 27:17.',
          'Iron and Ember is not currently open for public enrollment. As interest grows, new groups may form prayerfully, with clear leadership and structure.',
        ],
      },
      {
        type: 'list',
        heading: 'How FaithFlow Groups Work',
        items: [
          '<strong>Small and personal.</strong> Groups stay intentionally small. New groups may form prayerfully as interest grows.',
          '<strong>Named and organized.</strong> Each group has its own name, identity, and character, rooted in the same FaithFlow principles.',
          '<strong>Led with humility.</strong> Leaders serve, guide, and equip. They do not dominate or perform.',
          '<strong>Scripture-rooted.</strong> The Bible is the foundation, not an afterthought.',
          '<strong>Faithful community.</strong> The goal is faithfulness, not metrics or hype.',
        ],
      },
      {
        type: 'scriptures',
        heading: 'Scripture We Stand On',
        items: [
          { ref: 'Proverbs 27:17', text: 'As iron sharpens iron, so one person sharpens another.' },
          {
            ref: 'Hebrews 10:24–25',
            text: 'Let us consider how we may spur one another on toward love and good deeds… not giving up meeting together.',
          },
          {
            ref: 'Acts 2:42',
            text: 'They devoted themselves to the apostles’ teaching and to fellowship, to the breaking of bread and to prayer.',
          },
        ],
      },
      {
        type: 'resources',
        heading: 'Trusted Resources for Community',
        intro: 'Starting points for growing in faith and community right where you are.',
        items: [
          {
            name: 'BibleProject',
            desc: 'Deeply researched, visually rich Bible study content. Free.',
            url: 'https://bibleproject.com',
          },
          {
            name: 'YouVersion Bible App',
            desc: 'Free Bible app with reading plans you can share with friends for accountability.',
            url: 'https://www.bible.com',
          },
          {
            name: 'Desiring God',
            desc: 'Articles, podcasts, and books rooted in Scripture by John Piper and others.',
            url: 'https://www.desiringgod.org',
          },
          {
            name: 'Knowing God by J.I. Packer',
            desc: 'A foundational book on the character and nature of God.',
            url: 'https://www.crossway.org/books/knowing-god-tpb/',
          },
        ],
      },
    ],
  },

  'future-group': {
    eyebrow: 'You Asked About',
    title: 'A Future FaithFlow Group',
    sections: [
      {
        type: 'prose',
        heading: 'While You Wait',
        paragraphs: [
          'Faithful community begins long before a group forms. The strongest groups are made of people who already know how to seek Christ on their own.',
          'Use this season to build a foundation. Daily Scripture, honest prayer, and personal discipline. When a group does form, you will bring real depth to it.',
        ],
      },
      {
        type: 'list',
        heading: 'A Simple Place to Start',
        items: [
          'Read one chapter of the Gospel of <strong>John</strong> each day for 21 days. Do not rush. Underline what stands out.',
          'Pray honestly, even if just a few sentences a day. Confess. Thank. Ask.',
          'Find one trusted Christian friend and tell them you are trying to grow. Ask them to check on you weekly.',
          'Avoid using "I am too busy" as a reason. Spend 15 minutes less on something else instead.',
        ],
      },
      {
        type: 'scriptures',
        heading: 'Scripture for the Foundation',
        items: [
          {
            ref: 'Psalm 1:2–3',
            text: 'But whose delight is in the law of the Lord, and who meditates on his law day and night. That person is like a tree planted by streams of water.',
          },
          {
            ref: 'Matthew 7:24',
            text: 'Therefore everyone who hears these words of mine and puts them into practice is like a wise man who built his house on the rock.',
          },
          {
            ref: 'Philippians 1:6',
            text: 'Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.',
          },
        ],
      },
      {
        type: 'resources',
        heading: 'Foundational Resources',
        intro:
          'For someone newer to faith or rebuilding the basics. These are trusted, accessible starting points.',
        items: [
          {
            name: 'BibleProject',
            desc: 'Free, visual explanations of every book of the Bible. The clearest place to start.',
            url: 'https://bibleproject.com',
          },
          {
            name: 'YouVersion Bible App',
            desc: 'Free Bible app with hundreds of reading plans, including 7-day intros to faith.',
            url: 'https://www.bible.com',
          },
          {
            name: 'Mere Christianity by C.S. Lewis',
            desc: 'A short, clear book that explains the heart of Christian faith honestly.',
            url: 'https://www.harpercollins.com/products/mere-christianity-c-s-lewis',
          },
          {
            name: 'Got Questions',
            desc: 'Bible-rooted answers to thousands of common questions about faith.',
            url: 'https://www.gotquestions.org',
          },
        ],
      },
    ],
  },

  'help-start': {
    eyebrow: 'You Asked About',
    title: 'Helping Start a Group',
    sections: [
      {
        type: 'prose',
        heading: 'What This Means',
        paragraphs: [
          'Thank you for being willing. We do not take this lightly, and neither should you.',
          'FaithFlow groups are led by people who are first being led themselves. Led by Christ, by Scripture, and by other faithful believers. Leadership in FaithFlow is service, not status.',
        ],
      },
      {
        type: 'list',
        heading: 'What We Are Looking For in Future Leaders',
        items: [
          '<strong>Faithful in their own walk.</strong> The private life matches the public one.',
          '<strong>Humble and willing to serve.</strong> Leaders here are not performers.',
          '<strong>Spiritually mature and growing.</strong> Not perfect, but moving forward.',
          '<strong>Accountable to others.</strong> Already in submission, not seeking authority.',
          '<strong>Committed to Scripture.</strong> The Bible is the standard, not personal preference.',
          '<strong>Willing to invest in people.</strong> Real time, real care, real cost.',
        ],
      },
      {
        type: 'list',
        heading: 'What a FaithFlow Group Asks of a Leader',
        items: [
          'Show up consistently, not just when it is convenient.',
          'Open Scripture honestly, including the parts that confront you.',
          'Hold confidence. What is shared in the group stays there.',
          'Encourage and confront with love. Silence is not faithfulness.',
          'Pray for each member by name.',
          'Stay teachable. Leaders are also being shaped.',
        ],
      },
      {
        type: 'scriptures',
        heading: 'Scripture for Leaders',
        items: [
          {
            ref: 'James 3:1',
            text: 'Not many of you should become teachers, my brothers and sisters, because you know that we who teach will be judged more strictly.',
          },
          {
            ref: '1 Peter 5:2–3',
            text: 'Be shepherds of God’s flock that is under your care… not lording it over those entrusted to you, but being examples to the flock.',
          },
          {
            ref: 'Philippians 2:3–4',
            text: 'Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves.',
          },
        ],
      },
      {
        type: 'resources',
        heading: 'Resources for Future Leaders',
        intro:
          'If you sense a real calling, these will sharpen your understanding of community, Scripture, and humble leadership.',
        items: [
          {
            name: 'The Trellis and the Vine by Marshall and Payne',
            desc: 'On building people, not programs. The clearest book on disciple-making we know of.',
            url: 'https://matthiasmedia.com/products/the-trellis-and-the-vine',
          },
          {
            name: 'Spiritual Leadership by J. Oswald Sanders',
            desc: 'A timeless guide on what humble Christian leadership actually looks like.',
            url: 'https://www.moodypublishers.com/books/christian-living/spiritual-leadership/',
          },
          {
            name: '9Marks',
            desc: 'Resources on healthy church life, small groups, and biblical leadership.',
            url: 'https://www.9marks.org',
          },
          {
            name: 'Ligonier Ministries',
            desc: 'Teaching, study tools, and articles for those serious about Scripture.',
            url: 'https://www.ligonier.org',
          },
        ],
      },
      {
        type: 'prose',
        heading: 'What Happens Next',
        paragraphs: [
          'When we read your message, we will respond personally. We do not auto-onboard leaders. There may be conversation, time, and prayer before any next step.',
          'In the meantime, keep walking faithfully where you are. That is the qualification before any title.',
        ],
      },
    ],
  },

  'learn-more': {
    eyebrow: 'You Asked About',
    title: 'FaithFlow, In Brief',
    sections: [
      {
        type: 'prose',
        heading: 'What FaithFlow Is',
        paragraphs: [
          'FaithFlow is the Christ Fields community framework for real people walking together in Christ. Not an app. Not a brand. Real, in-person community grounded in Scripture.',
          'It is built on the truth that we do not grow alone. We grow through honest friendship, accountability, and faithful study together.',
        ],
      },
      {
        type: 'prose',
        heading: 'Where It Stands Right Now',
        paragraphs: [
          'Iron and Ember is the first active FaithFlow group, meeting in Colorado. As interest grows, new groups may form prayerfully, with clear leadership and structure.',
          'We are not in a hurry to grow. We are building this carefully.',
        ],
      },
      {
        type: 'scriptures',
        heading: 'The Heart of It',
        items: [
          { ref: 'Proverbs 27:17', text: 'As iron sharpens iron, so one person sharpens another.' },
          {
            ref: 'Acts 2:42',
            text: 'They devoted themselves to the apostles’ teaching and to fellowship, to the breaking of bread and to prayer.',
          },
        ],
      },
      {
        type: 'resources',
        heading: 'Starting Points for Faith',
        intro:
          'Whether you are new to faith, returning, or simply curious, these are trusted places to begin.',
        items: [
          {
            name: 'BibleProject',
            desc: 'Visual, deeply researched Bible content. Free, accessible at any starting point.',
            url: 'https://bibleproject.com',
          },
          {
            name: 'Mere Christianity by C.S. Lewis',
            desc: 'A timeless explanation of the heart of Christian faith. Short, clear, and honest.',
            url: 'https://www.harpercollins.com/products/mere-christianity-c-s-lewis',
          },
          {
            name: 'The Reason for God by Tim Keller',
            desc: 'Christianity for thoughtful skeptics. Addresses the hardest questions head-on.',
            url: 'https://www.penguinrandomhouse.com/books/178708/the-reason-for-god-by-timothy-keller/',
          },
          {
            name: 'Got Questions',
            desc: 'Bible-rooted answers to thousands of questions about faith.',
            url: 'https://www.gotquestions.org',
          },
        ],
      },
    ],
  },
};
