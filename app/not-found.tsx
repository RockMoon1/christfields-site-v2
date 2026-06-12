import type { Metadata } from 'next';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { Reveal } from '@/components/Reveal';
import { HeroSpotlight } from '@/components/motion/HeroSpotlight';
import { TextSplit } from '@/components/motion/TextSplit';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

/**
 * Custom 404 page. Renders in Christ Fields style instead of the default
 * Next.js black-and-white not-found page. A free brand moment: the display
 * type rises word by word out of a mask (the hero's entrance language),
 * the ambient treatment matches the hero (radial glow, film grain, cursor
 * spotlight), and the verse arrives last — slow and reverent, word for word.
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

          {/* Film grain, matching the hero's textured finish. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-soft-light"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Cursor-following gold spotlight, same as the hero. */}
          <HeroSpotlight />

          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <Reveal>
                <p className="mb-6 font-display text-xs font-medium uppercase tracking-[0.22em] text-gold">
                  404
                </p>
              </Reveal>

              <h1 className="mb-6 font-display text-[clamp(2.8rem,6vw,4.5rem)] font-light leading-[1.05] text-ivory">
                <TextSplit text="Not" by="word" mask />{' '}
                <em className="not-italic text-gold-lt">
                  <TextSplit text="Found." by="word" mask delay={0.12} />
                </em>
              </h1>

              <Reveal delay={0.35}>
                <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-ivory-dim md:text-lg">
                  The page you were looking for is not here. It may have moved, or it may never
                  have existed. Either way, here are a few places that might be what you wanted.
                </p>
              </Reveal>

              <Reveal delay={0.5}>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button href="/">Home &rarr;</Button>
                  <Button href="/faithflow" variant="ghost">
                    FaithFlow
                  </Button>
                  <Button href="/#projects" variant="ghost">
                    All Projects
                  </Button>
                </div>
              </Reveal>

              {/* The verse arrives last, word by word, at reading pace. */}
              <p className="mt-12 font-display text-base italic text-silver">
                &ldquo;
                <TextSplit
                  text="As iron sharpens iron, so one person sharpens another."
                  by="word"
                  mask
                  delay={0.9}
                  stagger={0.07}
                />
                &rdquo;
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
