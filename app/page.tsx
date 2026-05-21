import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { AnimatedDivider } from '@/components/motion/AnimatedDivider';
import { Hero } from '@/components/sections/Hero';
import { DashboardInvite } from '@/components/sections/DashboardInvite';
import { JoinForm } from '@/components/sections/JoinForm';
import { ProjectsGrid } from '@/components/sections/ProjectsGrid';
import { ScholarFlowFeature } from '@/components/sections/ScholarFlowFeature';
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
      <main id="main">
        <Hero />
        <AnimatedDivider />
        <Vision />
        <AnimatedDivider />
        <DashboardInvite />
        <AnimatedDivider />
        <ScholarFlowFeature />
        <AnimatedDivider />
        <ProjectsGrid />
        <AnimatedDivider />
        <Values />
        <AnimatedDivider />
        <JoinForm />
      </main>
      <Footer />
    </>
  );
}
