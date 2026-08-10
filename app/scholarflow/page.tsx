import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { AnimatedDivider } from '@/components/motion/AnimatedDivider';
import { ScriptureMarquee } from '@/components/motion/ScriptureMarquee';
import { SectionRail } from '@/components/motion/SectionRail';
import { SFHero } from '@/components/sections/scholarflow/SFHero';
import { WhatIsScholarFlow } from '@/components/sections/scholarflow/WhatIsScholarFlow';
import { SFPreviewSection } from '@/components/sections/scholarflow/SFPreviewSection';
import { ProductShelf } from '@/components/sections/scholarflow/ProductShelf';
import { SFInvite } from '@/components/sections/scholarflow/SFInvite';

export const metadata: Metadata = {
  title: 'ScholarFlow',
  description:
    'ScholarFlow is the Christ Fields category of faith and study tools. GraceFlow is live today, with LearnFlow, its deep-study tier, inside, and more on the way.',
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
  { id: 'what', label: 'The Shelf' },
  { id: 'preview', label: 'Preview' },
  { id: 'products', label: 'The Tools' },
  { id: 'invite', label: "What's Next" },
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

/* ScholarFlow's scripture band speaks wisdom and skill: seeking understanding,
   handling the Word rightly, and using good tools well — Scripture itself
   commends the sharpened ax (Ecclesiastes 10:10, WEB: "skill brings success"). */
const marqueeOne = [
  'Wisdom is supreme. Get wisdom',
  'Proverbs 4:7',
  'If any of you lacks wisdom, ask',
  'James 1:5',
  'Properly handling the Word of Truth',
  '2 Timothy 2:15',
  'Skill brings success',
  'Ecclesiastes 10:10',
];

const marqueeTwo = [
  'In a multitude of counselors',
  'Proverbs 15:22',
  'The wise hear, and increase in learning',
  'Proverbs 1:5',
  'Better to get wisdom than gold',
  'Proverbs 16:16',
  'Instruct the wise, and they will be wiser',
  'Proverbs 9:9',
];

export default function ScholarFlowPage() {
  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <SectionRail sections={railSections} cta={{ href: '#products', label: 'Tools' }} />
      {/* SectionLift wrappers removed: each section now owns its entrance
          (SectionHeader mask rise + inner reveals), so the old whole-section
          lift was double-fading everything on the page. */}
      <main id="main" className="relative">
        <SFHero />
        <ScriptureMarquee lineOne={marqueeOne} lineTwo={marqueeTwo} />
        <WhatIsScholarFlow />
        <SFPreviewSection />
        <AnimatedDivider />
        <ProductShelf />
        <AnimatedDivider />
        <SFInvite />
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
