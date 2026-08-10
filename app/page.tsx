import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { AnimatedDivider } from '@/components/motion/AnimatedDivider';
import { ScriptureMarquee } from '@/components/motion/ScriptureMarquee';
import { SectionRail } from '@/components/motion/SectionRail';
import { Hero } from '@/components/sections/Hero';
import { JoinForm } from '@/components/sections/JoinForm';
import { BentoGrid } from '@/components/sections/BentoGrid';
import { DayScroll } from '@/components/sections/DayScroll';
import { JourneyScroll } from '@/components/sections/JourneyScroll';
import { PracticesScroll } from '@/components/sections/PracticesScroll';
import { StatsBand } from '@/components/sections/StatsBand';
import { Values } from '@/components/sections/Values';
import { Vision } from '@/components/sections/Vision';

/**
 * Christ Fields home page.
 *
 * Sections own their entrance choreography individually (SectionHeader +
 * per-element reveals), so nothing here wraps them in a second whole-section
 * fade — the old SectionLift stacking made every part of the page arrive
 * with the same double rise-and-fade. DashboardInvite now lives on
 * /faithflow and the ScholarFlow preview on /scholarflow (2026-08-09):
 * the homepage stays a short walk, and the BentoGrid tiles are the doors
 * to each field's own page.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <SectionRail />
      <main id="main">
        <Hero />
        <ScriptureMarquee />
        <Vision />
        <StatsBand />
        <JourneyScroll />
        <PracticesScroll />
        <DayScroll />
        <AnimatedDivider />
        <BentoGrid />
        <AnimatedDivider />
        <Values />
        <AnimatedDivider />
        <div id="join">
          <JoinForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
