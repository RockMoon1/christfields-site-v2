import Link from 'next/link';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { MagneticButton } from '../../motion/MagneticButton';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';

/**
 * Hero for the ScholarFlow CATEGORY page. Frames ScholarFlow as a shelf of
 * tools (not a single product), mirroring the FaithFlow page's hero rhythm.
 */
export function SFHero() {
  return (
    <section id="top" className="relative flex min-h-[88vh] items-center overflow-hidden pb-20 pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 72% 18%, rgba(201,165,72,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 8% 92%, rgba(45,106,79,0.14) 0%, transparent 55%),
            #060908
          `,
        }}
      />
      <Container>
        <Reveal>
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.28em] text-gold">
            A Christ Fields category
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="max-w-3xl font-display text-[clamp(2.8rem,7vw,5.5rem)] font-light leading-[1.04] text-ivory">
            Scholar<em className="not-italic text-gold-lt">Flow.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory-dim md:text-xl">
            A growing shelf of faith and study tools. Open it, browse the apps, and pick the one that
            meets you where you are. Two are live right now.
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-4">
            <MagneticButton>
              <Link
                href="#products"
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-7 py-3.5 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
              >
                Browse the tools &rarr;
              </Link>
            </MagneticButton>
            <Link
              href="/#projects"
              className="text-xs font-medium uppercase tracking-[0.16em] text-silver underline-offset-4 transition-colors hover:text-gold-lt hover:underline"
            >
              See all fields
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.22}>
          <ScriptureSymbol className="mt-14 block text-2xl text-gold/70" />
        </Reveal>
      </Container>
    </section>
  );
}
