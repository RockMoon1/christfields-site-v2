import Link from 'next/link';
import { Reveal } from '../Reveal';

/**
 * Home page hero. Ports the v1 hero copy and structure exactly.
 * The "Iron." in the heading is italic gold as before.
 */
export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-7 pt-[var(--nav-h)]"
    >
      {/* Background atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 50% 28%, rgba(201, 165, 72, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(27, 67, 50, 0.18) 0%, transparent 60%),
            #060908
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-96 w-[120%] -translate-x-1/2 bg-gold/[0.04] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-1/2 -z-10 h-96 w-[120%] -translate-x-1/2 bg-emerald/[0.06] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="mb-6 font-display text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Proverbs 27:17
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mb-6 font-display text-[clamp(3.2rem,7vw,5.75rem)] font-light leading-[1.05] text-ivory">
            Iron Sharpens<br />
            <em className="not-italic text-gold-lt">Iron.</em>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-ivory-dim md:text-xl">
            Christ Fields is a technology company rooted in Christian faith, building tools and
            communities for people who want to live and work with wisdom, integrity, and faithfulness.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mb-10 font-display text-base italic text-silver md:text-lg">
            &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="#scholarflow"
              className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
            >
              Discover ScholarFlow &rarr;
            </Link>
            <Link
              href="#vision"
              className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Our Vision
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.3em] text-muted"
      >
        <p className="mb-2">Scroll</p>
        <div className="scroll-line mx-auto h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}
