import { Container } from '../../Container';
import { Reveal } from '../../Reveal';

export function WhatIsFaithFlow() {
  return (
    <section id="what" className="relative z-[2] py-[110px]">
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            The Framework
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-12 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            What Is <em className="not-italic text-gold-lt">FaithFlow?</em>
          </h2>
        </Reveal>

        <div className="max-w-2xl space-y-5 text-base leading-relaxed text-ivory-dim md:text-lg">
          <Reveal>
            <p>
              <strong className="font-medium text-ivory">
                FaithFlow is not an app. It is not a brand or an online group.
              </strong>{' '}
              FaithFlow is the Christ Fields community framework for real people walking together
              in Christ.
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <p>
              It is built on a simple truth: <em className="text-gold-lt">you do not grow alone.</em>{' '}
              Scripture teaches us that we need each other. Accountability, friendship, and
              faithful community are essential to discipleship.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <p>
              FaithFlow creates space for people to gather in small groups, study Scripture
              together, walk through life&rsquo;s challenges with honesty, and sharpen each other
              in faith, discipline, and truth.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <p>
              This is real community.{' '}
              <em className="text-gold-lt">Not digital. Not transactional.</em> Friends meeting,
              doing life together, and helping each other follow Christ more faithfully.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
