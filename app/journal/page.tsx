import type { Metadata } from 'next';
import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { Reveal } from '@/components/Reveal';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { getAllCategories, getAllPosts } from '@/lib/journal';

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Honest progress notes, devotional reflections, and behind-the-scenes from Christ Fields. Written slowly, without hype.',
  openGraph: {
    title: 'Journal by Christ Fields',
    description:
      'Honest progress notes, devotional reflections, and behind-the-scenes from Christ Fields.',
    url: 'https://christfields2717.com/journal',
  },
};

const navLinks = [
  { href: '/#vision', label: 'Vision' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#values', label: 'Values' },
  { href: '/#join', label: 'Join the Journey', cta: true },
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

export default function JournalIndexPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="pt-[var(--nav-h)]">
        <section className="py-[80px]">
          <Container>
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
                The Journal
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mb-6 font-display text-[clamp(2.8rem,5.5vw,4.5rem)] font-light leading-[1.05] text-ivory">
                Notes from the <em className="not-italic text-gold-lt">work.</em>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="max-w-2xl text-base leading-relaxed text-silver md:text-lg">
                Progress notes, devotional reflections, and behind-the-scenes from Christ Fields.
                Written slowly. Without hype. To be true rather than impressive.
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="pb-[120px]">
          <Container>
            <JournalGrid posts={posts} categories={categories} />
          </Container>
        </section>
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
