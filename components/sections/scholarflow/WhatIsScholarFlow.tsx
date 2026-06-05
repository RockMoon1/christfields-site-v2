import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { SCHOLARFLOW_INTRO } from '@/lib/content/scholarflow';

/**
 * Plainly answers "what is ScholarFlow?" for a first-time visitor, making the
 * category-not-a-product idea unmistakable (the Amazon-aisle mental model).
 */
export function WhatIsScholarFlow() {
  return (
    <section id="what" className="relative z-[2] py-[110px]">
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            {SCHOLARFLOW_INTRO.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mb-10 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            What Is <em className="not-italic text-gold-lt">ScholarFlow?</em>
          </h2>
        </Reveal>
        <div className="max-w-2xl space-y-5 text-base leading-relaxed text-ivory-dim md:text-lg">
          <Reveal>
            <p>
              <strong className="font-medium text-ivory">ScholarFlow is not one app. It is a category.</strong>{' '}
              Think of it like an aisle in a store. You open ScholarFlow to browse the tools we make,
              and pick the one that fits what you need.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <p>
              Every tool here grows from the same root:{' '}
              <em className="text-gold-lt">faith, study, and discipline.</em> Made carefully, to help
              you walk with God and think clearly.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>
              Two are live today, <strong className="font-medium text-ivory">GraceFlow</strong> and{' '}
              <strong className="font-medium text-ivory">LearnFlow</strong>. More are coming, in their
              own time.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
