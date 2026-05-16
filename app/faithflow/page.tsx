import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { AnimatedDivider } from '@/components/motion/AnimatedDivider';
import { ActiveGroups } from '@/components/sections/faithflow/ActiveGroups';
import { BiblicalFoundation } from '@/components/sections/faithflow/BiblicalFoundation';
import { EmberField } from '@/components/sections/faithflow/EmberField';
import { FFHero } from '@/components/sections/faithflow/FFHero';
import { FutureLeaders } from '@/components/sections/faithflow/FutureLeaders';
import { GetInvolved } from '@/components/sections/faithflow/GetInvolved';
import { HowGroupsWork } from '@/components/sections/faithflow/HowGroupsWork';
import { WhatIsFaithFlow } from '@/components/sections/faithflow/WhatIsFaithFlow';

export const metadata: Metadata = {
  title: 'FaithFlow',
  description:
    'FaithFlow is the Christ Fields community framework for real people walking together in Christ. Scripture-rooted small groups, accountability, and faithful community.',
  openGraph: {
    title: 'FaithFlow by Christ Fields',
    description:
      'Real community. Scripture-rooted accountability. Faith lived together. The Christ Fields community framework.',
    url: 'https://christfields2717.com/faithflow',
  },
  twitter: {
    title: 'FaithFlow by Christ Fields',
    description: 'Real community. Scripture-rooted accountability. Faith lived together.',
  },
};

const navLinks = [
  { href: '/#vision', label: 'Vision' },
  { href: '/#projects', label: 'Projects' },
  { href: '#groups', label: 'Active Groups' },
  { href: '#get-involved', label: 'Get Involved', cta: true },
];

const footerColumns = [
  {
    heading: 'FaithFlow',
    links: [
      { href: '#what', label: 'What It Is' },
      { href: '#groups', label: 'Active Groups' },
      { href: '#how', label: 'How It Works' },
      { href: '#scripture', label: 'Scripture' },
      { href: '#get-involved', label: 'Get Involved' },
    ],
  },
  {
    heading: 'Christ Fields',
    links: [
      { href: '/', label: 'Main Site' },
      { href: '/#vision', label: 'Vision' },
      { href: '/#projects', label: 'Projects' },
      { href: 'mailto:proverbs@christfields2717.com', label: 'proverbs@christfields2717.com' },
    ],
  },
];

export default function FaithFlowPage() {
  return (
    <>
      <EmberField />
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="relative">
        <FFHero />
        <AnimatedDivider />
        <WhatIsFaithFlow />
        <AnimatedDivider />
        <ActiveGroups />
        <AnimatedDivider />
        <HowGroupsWork />
        <AnimatedDivider />
        <BiblicalFoundation />
        <AnimatedDivider />
        <FutureLeaders />
        <AnimatedDivider />
        <GetInvolved />
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
