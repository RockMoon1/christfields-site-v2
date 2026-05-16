import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

/**
 * Custom 404 page. Renders in Christ Fields style instead of the default
 * Next.js black-and-white not-found page. Points the visitor to the home
 * page and a few useful entry points.
 */
export default function NotFound() {
  return (
    <>
      <Nav alwaysScrolled />
      <main id="main" className="pt-[var(--nav-h)]">
        <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden py-20">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background: `
                radial-gradient(ellipse at 50% 30%, rgba(201, 165, 72, 0.08) 0%, transparent 55%),
                radial-gradient(ellipse at 50% 90%, rgba(45, 106, 79, 0.10) 0%, transparent 60%),
                #060908
              `,
            }}
          />

          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-6 font-display text-xs font-medium uppercase tracking-[0.22em] text-gold">
                404
              </p>

              <h1 className="mb-6 font-display text-[clamp(2.8rem,6vw,4.5rem)] font-light leading-[1.05] text-ivory">
                Not <em className="not-italic text-gold-lt">Found.</em>
              </h1>

              <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-ivory-dim md:text-lg">
                The page you were looking for is not here. It may have moved, or it may never have
                existed. Either way, here are a few places that might be what you wanted.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
                >
                  Home &rarr;
                </Link>
                <Link
                  href="/faithflow"
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  FaithFlow
                </Link>
                <Link
                  href="/#projects"
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  All Projects
                </Link>
              </div>

              <p className="mt-12 font-display text-base italic text-silver">
                &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
