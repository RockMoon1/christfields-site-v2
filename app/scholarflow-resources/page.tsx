import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { ResourcePage, type Resource } from '@/components/sections/resources/ResourcePage';

export const metadata: Metadata = {
  title: 'ScholarFlow Resources',
  description:
    'Trusted tools recommended by Christ Fields for managing time, resisting distraction, and staying accountable while ScholarFlow is being built.',
  openGraph: {
    title: 'ScholarFlow Resources by Christ Fields',
    description:
      'Trusted tools for managing time, resisting distraction, and staying accountable. Curated by Christ Fields.',
    url: 'https://christfields2717.com/scholarflow-resources',
  },
};

/**
 * Tools we trust for the work that happens behind closed doors.
 * Each one chosen because it serves the actual work, not because it is popular.
 */
const resources: Resource[] = [
  {
    name: 'Reclaim.ai',
    desc: 'Intelligent time blocking that defends your priorities and schedules deep work automatically. Connects to your calendar and protects the hours that matter.',
    url: 'https://reclaim.ai',
  },
  {
    name: 'Freedom',
    desc: 'Block distracting sites and apps across every device, including phone, tablet, and desktop, on a schedule or on demand. One of the most reliable blockers available.',
    url: 'https://freedom.to',
  },
  {
    name: 'Opal',
    desc: 'Deep focus sessions and screen time limits with real accountability built in. Harder to cheat than most blockers, which is the point.',
    url: 'https://www.opal.so',
  },
  {
    name: 'Ever Accountable',
    desc: 'Honest accountability for what you do online, shared with someone you trust. Not a filter. A mirror. Built for people serious about integrity in private.',
    url: 'https://everaccountable.com',
  },
  {
    name: 'Victory by Covenant Eyes',
    desc: 'A community and accountability system built specifically to help men and women walk free from pornography. Combines real relationships with accountability software.',
    url: 'https://www.covenanteyes.com/victory/',
  },
];

const footerColumns = [
  {
    heading: 'Christ Fields',
    links: [
      { href: '/', label: 'Main Site' },
      { href: '/#vision', label: 'Vision' },
      { href: '/scholarflow', label: 'ScholarFlow' },
      { href: '/#projects', label: 'Projects' },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { href: 'mailto:proverbs@christfields2717.com', label: 'proverbs@christfields2717.com' },
    ],
  },
];

export default function ScholarFlowResourcesPage() {
  return (
    <>
      <Nav alwaysScrolled />
      <ResourcePage
        eyebrow="ScholarFlow · For Now"
        titleLine1="Trusted Resources"
        titleLine2="While We Build."
        description="ScholarFlow is coming. Until then, these are the tools we trust for managing time, resisting distraction, and staying accountable. Each one was chosen because it genuinely serves the work, not because it is popular."
        resources={resources}
      />
      <Footer columns={footerColumns} />
    </>
  );
}
