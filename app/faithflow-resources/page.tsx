import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { ResourcePage, type Resource } from '@/components/sections/resources/ResourcePage';

export const metadata: Metadata = {
  title: 'FaithFlow Resources',
  description:
    'Trusted scripture, community, and study resources recommended by Christ Fields while FaithFlow grows.',
  openGraph: {
    title: 'FaithFlow Resources by Christ Fields',
    description:
      'Trusted scripture, community, and study resources recommended by Christ Fields while FaithFlow grows.',
    url: 'https://christfields2717.com/faithflow-resources',
  },
};

/**
 * Curated list of trusted scripture, study, and community resources.
 * Each item is here because we trust it, not because it is popular.
 * Sorted from broadest accessible entry points to deeper commitment.
 */
const resources: Resource[] = [
  {
    name: 'BibleProject',
    desc: 'Deeply researched, visually rich Bible study content that takes Scripture seriously. Excellent for understanding the whole narrative of the Bible, book by book and theme by theme. Free.',
    url: 'https://bibleproject.com',
  },
  {
    name: 'The Bible Recap',
    desc: 'A daily Bible reading podcast and reading plan that walks through the entire Bible in one year. Tara-Leigh Cobble does the heavy lifting so you keep showing up. Free and accessible at any starting point.',
    url: 'https://thebiblerecap.com',
  },
  {
    name: 'Bible Study Fellowship',
    desc: 'Structured, in-depth group Bible study with chapters meeting worldwide every week. One of the most serious and consistent Bible study communities available to anyone, anywhere.',
    url: 'https://www.bsfinternational.org/bsf/',
  },
  {
    name: 'LifeChange Series',
    desc: 'Personal Bible study guides from the Navigators, built for steady, serious engagement with the text. Designed for the kind of slow, deliberate study that actually changes how you think.',
    url: 'https://www.navigators.org/resource/life-change-series/',
  },
  {
    name: 'NT Reading Plans by ESV',
    desc: 'Free New Testament reading plans from Crossway, publishers of the English Standard Version. Simple, structured, and built for the kind of daily discipline that compounds over months and years.',
    url: 'https://www.esv.org/resources/reading-plans/',
  },
  {
    name: 'Desiring God',
    desc: 'Articles, podcasts, and books rooted in Scripture by John Piper and others. A deep well for understanding the joy of knowing Christ and the cost of following him faithfully.',
    url: 'https://www.desiringgod.org',
  },
  {
    name: 'Celebrate Recovery',
    desc: 'Christ-centered recovery and support groups meeting in local churches across the country. Built on honesty, community, and the belief that real healing happens in relationship, not isolation.',
    url: 'https://www.celebraterecovery.com/',
  },
];

const footerColumns = [
  {
    heading: 'Christ Fields',
    links: [
      { href: '/', label: 'Main Site' },
      { href: '/#vision', label: 'Vision' },
      { href: '/#projects', label: 'Projects' },
      { href: '/faithflow', label: 'FaithFlow' },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { href: 'mailto:proverbs@christfields2717.com', label: 'proverbs@christfields2717.com' },
    ],
  },
];

export default function FaithFlowResourcesPage() {
  return (
    <>
      <Nav alwaysScrolled />
      <ResourcePage
        eyebrow="FaithFlow · For Now"
        titleLine1="Trusted Resources"
        titleLine2="While We Build."
        description="FaithFlow is growing. Until you find your way into a local group, these are the communities, reading plans, and study tools we trust for genuine spiritual growth. Not a curated list for appearance. Resources that actually require something of you."
        resources={resources}
      />
      <Footer columns={footerColumns} />
    </>
  );
}
