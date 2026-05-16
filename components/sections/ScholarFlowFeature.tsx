import Link from 'next/link';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { CardSpotlight } from '../motion/CardSpotlight';
import { MagneticButton } from '../motion/MagneticButton';
import { ScriptureSymbol } from '../motion/ScriptureSymbol';

export function ScholarFlowFeature() {
  return (
    <section
      id="scholarflow"
      className="relative border-t border-border-sub bg-black-2 py-[110px]"
    >
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Flagship Product
          </p>
        </Reveal>

        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <Reveal>
              <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
                Scholar<em className="not-italic text-gold-lt">Flow.</em>
              </h2>
            </Reveal>

            <Reveal delay={0.05}>
              <p className="mb-6 max-w-xl text-base leading-relaxed text-ivory-dim md:text-lg">
                A web app built to help students and young adults manage their time, resist
                distraction, and practice real self-control. Designed for the work that happens away
                from any audience, behind closed doors.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mb-8 flex flex-wrap gap-2">
                {['Productivity', 'AI', 'Habit Building'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-border-sub bg-black-4 px-3 py-1 text-xs tracking-wider text-ivory-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mb-6 flex flex-wrap gap-3">
                <MagneticButton>
                  <Link
                    href="#join"
                    className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
                  >
                    Get Early Access &rarr;
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link
                    href="/scholarflow-resources"
                    className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                  >
                    Trusted Resources &rarr;
                  </Link>
                </MagneticButton>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-sm text-muted">
                A <strong className="text-ivory-dim">Christ Fields</strong> product. Built on faith,
                designed with discipline.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <CardSpotlight className="rounded-sm">
            <aside className="relative h-fit overflow-hidden rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-8 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"
              />
              <ScriptureSymbol symbol="◈" className="mb-4 block font-display text-3xl text-gold" />
              <blockquote className="mb-4 font-display text-xl italic leading-relaxed text-ivory-dim">
                &ldquo;Commit your work to the Lord, and your plans will be established.&rdquo;
              </blockquote>
              <cite className="mb-6 block text-xs not-italic uppercase tracking-[0.18em] text-gold">
                Proverbs 16:3
              </cite>
              <span className="inline-block rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-gold">
                Coming Soon
              </span>
            </aside>
            </CardSpotlight>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
