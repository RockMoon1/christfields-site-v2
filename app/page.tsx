import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { AnimatedDivider } from '@/components/motion/AnimatedDivider';
import { ScriptureMarquee } from '@/components/motion/ScriptureMarquee';
import { SectionLift } from '@/components/motion/SectionLift';
import { SectionRail } from '@/components/motion/SectionRail';
import { Hero } from '@/components/sections/Hero';
import { DashboardInvite } from '@/components/sections/DashboardInvite';
import { JoinForm } from '@/components/sections/JoinForm';
import { BentoGrid } from '@/components/sections/BentoGrid';
import { JourneyScroll } from '@/components/sections/JourneyScroll';
import { PracticesScroll } from '@/components/sections/PracticesScroll';
import { ScholarFlowFeature } from '@/components/sections/ScholarFlowFeature';
import { StatsBand } from '@/components/sections/StatsBand';
import { Values } from '@/components/sections/Values';
import { Vision } from '@/components/sections/Vision';

/**
 * Christ Fields home page.
 *
 * The DashboardInvite section sits high in the flow, right after Vision, so
 * visitors meet the live member dashboard and FaithFlow community early.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <SectionRail />
      <main id="main">
        <Hero />
        <ScriptureMarquee />
        <SectionLift>
          <Vision />
        </SectionLift>
        <SectionLift>
          <StatsBand />
        </SectionLift>
        <JourneyScroll />
        <SectionLift id="dashboard">
          <DashboardInvite />
        </SectionLift>
        <SectionLift>
          <PracticesScroll />
        </SectionLift>
        <AnimatedDivider />
        <SectionLift>
          <ScholarFlowFeature />
        </SectionLift>
        <AnimatedDivider />
        <SectionLift>
          <BentoGrid />
        </SectionLift>
        <AnimatedDivider />
        <SectionLift>
          <Values />
        </SectionLift>
        <AnimatedDivider />
        <SectionLift id="join">
          <JoinForm />
        </SectionLift>
      </main>
      <Footer />
    </>
  );
}
