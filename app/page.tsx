import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/sections/Hero';
import { JoinForm } from '@/components/sections/JoinForm';
import { ProjectsGrid } from '@/components/sections/ProjectsGrid';
import { ScholarFlowFeature } from '@/components/sections/ScholarFlowFeature';
import { Values } from '@/components/sections/Values';
import { Vision } from '@/components/sections/Vision';

/**
 * Christ Fields home page (Phase 2).
 *
 * Section order mirrors the v1 site exactly so this can be reviewed
 * side by side with christfields2717.com.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Vision />
        <ScholarFlowFeature />
        <ProjectsGrid />
        <Values />
        <JoinForm />
      </main>
      <Footer />
    </>
  );
}
