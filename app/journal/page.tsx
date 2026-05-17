import type { Metadata } from 'next';
import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { Reveal } from '@/components/Reveal';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { CountUp } from '@/components/motion/CountUp';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { TextSplit } from '@/components/motion/TextSplit';
import { ScriptureSymbol } from '@/components/motion/ScriptureSymbol';
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

  // Find the oldest post date so we can show "Writing since" stat
  const oldestPost = posts[posts.length - 1];
  const oldestDate = oldestPost
    ? new Date(oldestPost.frontmatter.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="pt-[var(--nav-h)]">
        {/* Hero section with ambient motion */}
        <section className="relative overflow-hidden py-[80px] md:py-[110px]">
          <MorphBlob color="rgba(201, 165, 72, 0.06)" size={620} className="-left-40 -top-32" />
          <MorphBlob color="rgba(27, 67, 50, 0.06)" size={520} className="-right-32 top-20" />

          <Container>
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
                The Journal
              </p>
            </Reveal>

            <h1 className="mb-6 font-display text-[clamp(2.8rem,5.5vw,4.5rem)] font-light leading-[1.05] text-ivory">
              <TextSplit text="Notes from the " delay={0.1} />
              <em className="not-italic text-gold-lt">
                <TextSplit text="work." delay={0.45} />
              </em>
            </h1>

            <Reveal delay={0.8}>
              <p className="max-w-2xl text-base leading-relaxed text-silver md:text-lg">
                Progress notes, devotional reflections, and behind-the-scenes from Christ Fields.
                Written slowly. Without hype. To be true rather than impressive.
              </p>
            </Reveal>

            {/* Stats strip */}
            <Reveal delay={0.95}>
              <div className="mt-12 flex flex-wrap items-center gap-x-12 gap-y-4 border-t border-border-sub pt-6">
                <div>
                  <p className="font-display text-3xl font-light text-gold-lt md:text-4xl">
                    <CountUp to={posts.length} duration={1400} />
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    {posts.length === 1 ? 'Post' : 'Posts'}
                  </p>
                </div>
                <div>
                  <p className="font-display text-3xl font-light text-gold-lt md:text-4xl">
                    <CountUp to={categories.length} duration={1400} />
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    {categories.length === 1 ? 'Category' : 'Categories'}
                  </p>
                </div>
                {oldestDate && (
                  <div>
                    <p className="font-display text-xl font-light text-gold-lt md:text-2xl">
                      {oldestDate}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      Writing since
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Grid section */}
        <section className="pb-[80px]">
          <Container>
            <JournalGrid posts={posts} categories={categories} />
          </Container>
        </section>

        {/* Scripture closing band */}
        <section className="relative overflow-hidden border-t border-border-sub bg-black-2 py-[80px]">
          <MorphBlob color="rgba(201, 165, 72, 0.04)" size={520} className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

          <Container>
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <ScriptureSymbol className="mb-6 inline-block text-3xl text-gold" />
                <blockquote className="mb-4 font-display text-2xl italic leading-relaxed text-ivory md:text-3xl">
                  &ldquo;Write the vision; make it plain on tablets, so he may run who reads it.&rdquo;
                </blockquote>
                <cite className="text-xs not-italic uppercase tracking-[0.18em] text-gold">
                  Habakkuk 2:2
                </cite>
                <p className="mt-8 text-sm leading-relaxed text-silver">
                  We write to keep ourselves honest. Posts here arrive when something is real, not
                  when something is launching. If you want them in your inbox, sign up on the main
                  site.
                </p>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
