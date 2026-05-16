import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { CardSpotlight } from '../../motion/CardSpotlight';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';

/**
 * Public-facing Future Leaders section. Intentionally soft.
 *
 * The actual leadership criteria (the checklist that could read as judgmental
 * to a casual visitor) is NOT shown here. It is shown only inside the success
 * card after someone selects "I'm interested in helping start a group" in the
 * Get Involved form. That keeps the surface friendly while the depth waits
 * for people who have already shown intent.
 */
export function FutureLeaders() {
  return (
    <section id="leaders" className="relative z-[2] py-[110px]">
      <Container>
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
                Looking Ahead
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
                Future <em className="not-italic text-gold-lt">Leaders.</em>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mb-4 text-base leading-relaxed text-ivory-dim md:text-lg">
                As FaithFlow grows, leaders will emerge prayerfully and faithfully through
                relationships, time, and shared service. We are not in a hurry to grow.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="text-base leading-relaxed text-ivory-dim md:text-lg">
                If this resonates with something already in you, reach out below. We would rather
                have a real conversation than make a list of requirements upfront.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <CardSpotlight className="rounded-sm md:sticky md:top-[120px]">
            <aside className="relative h-fit overflow-hidden rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-8 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"
              />
              <ScriptureSymbol symbol="◈" className="mb-4 block font-display text-3xl text-gold" />
              <blockquote className="mb-4 font-display text-lg italic leading-relaxed text-ivory-dim">
                &ldquo;Not many of you should become teachers, my brothers and sisters, because you
                know that we who teach will be judged more strictly.&rdquo;
              </blockquote>
              <cite className="text-[11px] not-italic uppercase tracking-[0.18em] text-gold">
                James 3:1
              </cite>
            </aside>
            </CardSpotlight>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
