import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { Reveal } from '@/components/Reveal';
import { JournalArticle } from '@/components/journal/JournalArticle';
import { mdxComponents } from '@/components/journal/mdxComponents';
import { MorphBlob } from '@/components/motion/MorphBlob';
import { getAllPosts, getNextPost, getPostBySlug } from '@/lib/journal';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-render every post at build time so the journal stays static and fast.
 */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Not Found' };

  const fm = post.frontmatter;
  return {
    title: fm.title,
    description: fm.excerpt,
    openGraph: {
      title: `${fm.title} by Christ Fields`,
      description: fm.excerpt,
      url: `https://christfields2717.com/journal/${fm.slug}`,
      type: 'article',
      publishedTime: fm.date,
    },
    twitter: {
      title: `${fm.title} by Christ Fields`,
      description: fm.excerpt,
    },
  };
}

const navLinks = [
  { href: '/journal', label: 'Journal' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#values', label: 'Values' },
  { href: '/#join', label: 'Join the Journey', cta: true },
];

const footerColumns = [
  {
    heading: 'Christ Fields',
    links: [
      { href: '/', label: 'Main Site' },
      { href: '/journal', label: 'Journal' },
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

export default async function JournalPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const fm = post.frontmatter;
  const nextPost = getNextPost(slug);
  const coverColor = fm.cover?.color ?? '#C9A548';

  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="pt-[var(--nav-h)]">
        {/* Cover band. Tinted with the post's cover color. Sits between nav and article. */}
        <div
          aria-hidden
          className="relative h-40 w-full overflow-hidden md:h-56"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, ${coverColor}44 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${coverColor}22 0%, transparent 60%), #0c110e`,
          }}
        >
          <MorphBlob color={`${coverColor}33`} size={400} className="-left-20 -top-20" />
          <MorphBlob color={`${coverColor}22`} size={350} className="-bottom-16 right-10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <section className="py-[60px] md:py-[80px]">
          <Container>
            {/* Back link */}
            <Reveal>
              <Link
                href="/journal"
                className="mb-10 inline-flex items-center text-xs font-medium uppercase tracking-[0.16em] text-silver transition-colors hover:text-gold-lt"
              >
                ← Back to Journal
              </Link>
            </Reveal>

            {/* Article header */}
            <header className="mx-auto mb-12 max-w-2xl">
              <Reveal>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em]">
                  <span className="text-gold">{fm.category}</span>
                  <span className="text-muted">·</span>
                  <span className="text-silver">
                    {new Date(fm.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="text-silver">{post.readingMinutes} min read</span>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="font-display text-[clamp(2.4rem,4.5vw,4rem)] font-light leading-[1.05] text-ivory">
                  {fm.title}
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-6 text-lg italic leading-relaxed text-silver md:text-xl">
                  {fm.excerpt}
                </p>
              </Reveal>
            </header>

            {/* Article body, MDX rendered with custom components */}
            <JournalArticle>
              <MDXRemote source={post.body} components={mdxComponents} />
            </JournalArticle>

            {/* Footer divider */}
            <div
              aria-hidden
              className="mx-auto my-16 h-px max-w-md bg-gradient-to-r from-transparent via-gold/40 to-transparent"
            />

            {/* Next post suggestion */}
            {nextPost && (
              <Reveal>
                <div className="mx-auto max-w-2xl">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-gold">
                    Next post
                  </p>
                  <Link
                    href={`/journal/${nextPost.slug}`}
                    className="group block rounded-sm border border-border-sub bg-black-2 p-6 transition-[border-color] duration-300 hover:border-border-gold"
                  >
                    <div className="mb-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em]">
                      <span className="text-gold">{nextPost.frontmatter.category}</span>
                      <span className="text-muted">·</span>
                      <span className="text-silver">{nextPost.readingMinutes} min read</span>
                    </div>
                    <h2 className="mb-2 font-display text-2xl font-light text-ivory transition-colors duration-300 group-hover:text-gold-lt md:text-3xl">
                      {nextPost.frontmatter.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-silver">
                      {nextPost.frontmatter.excerpt}
                    </p>
                  </Link>
                </div>
              </Reveal>
            )}

            {/* Back to journal CTA */}
            <Reveal delay={0.1}>
              <div className="mx-auto mt-12 max-w-2xl text-center">
                <Link
                  href="/journal"
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  ← All Journal entries
                </Link>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
