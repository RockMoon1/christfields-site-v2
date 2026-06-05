import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { AnimatedDivider } from '@/components/motion/AnimatedDivider';
import { ScriptureMarquee } from '@/components/motion/ScriptureMarquee';
import { SectionLift } from '@/components/motion/SectionLift';
import { SectionRail } from '@/components/motion/SectionRail';
import { SFHero } from '@/components/sections/scholarflow/SFHero';
import { WhatIsScholarFlow } from '@/components/sections/scholarflow/WhatIsScholarFlow';
import { ProductShelf } from '@/components/sections/scholarflow/ProductShelf';
import { SFInvite } from '@/components/sections/scholarflow/SFInvite';

export const metadata: Metadata = {
  title: 'ScholarFlow',
  description:
    'ScholarFlow is the Christ Fields category of faith and study tools. Browse the apps we make, GraceFlow and LearnFlow, with more on the way.',
  openGraph: {
    title: 'ScholarFlow by Christ Fields',
    description:
      'A growing shelf of faith and study tools. GraceFlow and LearnFlow are live now.',
    url: 'https://christfields2717.com/scholarflow',
  },
  twitter: {
    title: 'ScholarFlow by Christ Fields',
    description: 'A growing shelf of faith and study tools. GraceFlow and LearnFlow are live now.',
  },
};

const navLinks = [
  { href: '/#vision', label: 'Vision' },
  { href: '/#projects', label: 'Fields' },
  { href: '#products', label: 'The Tools' },
  { href: '/#join', label: 'Get Involved', cta: true },
];

const railSections = [
  { id: 'top', label: 'Top' },
  { id: 'what', label: 'What' },
  { id: 'products', label: 'Tools' },
  { id: 'invite', label: 'More' },
];

const footerColumns = [
  {
    heading: 'ScholarFlow',
    links: [
      { href: '#what', label: 'What It Is' },
      { href: '#products', label: 'The Tools' },
      { href: 'https://graceflows.netlify.app', label: 'GraceFlow' },
      { href: '/scholarflow-resources', label: 'Trusted Resources' },
    ],
  },
  {
    heading: 'Christ Fields',
    links: [
      { href: '/', label: 'Main Site' },
      { href: '/#vision', label: 'Vision' },
      { href: '/#projects', label: 'Fields' },
      { href: 'mailto:proverbs@christfields2717.com', label: 'proverbs@christfields2717.com' },
    ],
  },
];

export default function ScholarFlowPage() {
  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <SectionRail sections={railSections} cta={{ href: '#products', label: 'Tools' }} />
      <main id="main" className="relative">
        <SFHero />
        <ScriptureMarquee />
        <SectionLift>
          <WhatIsScholarFlow />
        </SectionLift>
        <AnimatedDivider />
        <SectionLift>
          <ProductShelf />
        </SectionLift>
        <AnimatedDivider />
        <SectionLift>
          <SFInvite />
        </SectionLift>
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
