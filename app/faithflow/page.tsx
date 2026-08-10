import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { AnimatedDivider } from '@/components/motion/AnimatedDivider';
import { ScriptureMarquee } from '@/components/motion/ScriptureMarquee';
import { SectionRail } from '@/components/motion/SectionRail';
import { ActiveGroups } from '@/components/sections/faithflow/ActiveGroups';
import { DashboardInvite } from '@/components/sections/DashboardInvite';
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
  { href: '#groups', label: 'The Community' },
  { href: '#get-involved', label: 'Get Involved', cta: true },
];

const railSections = [
  { id: 'top', label: 'Top' },
  { id: 'what', label: 'What' },
  { id: 'groups', label: 'Community' },
  { id: 'dashboard', label: 'Your Space' },
  { id: 'how', label: 'How' },
  { id: 'scripture', label: 'Scripture' },
  { id: 'leaders', label: 'Leaders' },
  { id: 'get-involved', label: 'Join' },
];

const footerColumns = [
  {
    heading: 'FaithFlow',
    links: [
      { href: '#what', label: 'What It Is' },
      { href: '#groups', label: 'The Community' },
      { href: '#dashboard', label: 'Member Dashboard' },
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

/* FaithFlow's scripture band speaks community: walking together, carrying
   each other, gathering. Phrase fragments are faithful to each verse (WEB
   wording where it differs from common memory: "exhort" in 1 Thess 5:11). */
const marqueeOne = [
  'Iron sharpens iron',
  'Proverbs 27:17',
  'Two are better than one',
  'Ecclesiastes 4:9',
  'Exhort one another, build each other up',
  '1 Thessalonians 5:11',
  'Where two or three are gathered',
  'Matthew 18:20',
];

const marqueeTwo = [
  'Confess, and pray for one another',
  'James 5:16',
  'Steadfast in teaching and fellowship',
  'Acts 2:42',
  'A threefold cord is not quickly broken',
  'Ecclesiastes 4:12',
  'Love one another, as I have loved you',
  'John 13:34',
];

export default function FaithFlowPage() {
  return (
    <>
      <EmberField />
      <Nav links={navLinks} alwaysScrolled />
      <SectionRail sections={railSections} cta={{ href: '#get-involved', label: 'Join' }} />
      {/* Sections own their entrances now (SectionHeader, clip reveals,
          per-word scripture), so the old SectionLift wrapper is gone — it
          double-faded every section and flattened the rhythm. Background
          bands (black-2 on Groups and Scripture) provide most seams; the
          drawn gold hairline is reserved for the two moments of arrival:
          entering the manifesto and approaching the call to join. */}
      <main id="main" className="relative">
        <FFHero />
        <ScriptureMarquee lineOne={marqueeOne} lineTwo={marqueeTwo} />
        <AnimatedDivider />
        <WhatIsFaithFlow />
        <ActiveGroups />
        <DashboardInvite />
        <HowGroupsWork />
        <BiblicalFoundation />
        <FutureLeaders />
        <AnimatedDivider />
        <GetInvolved />
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
