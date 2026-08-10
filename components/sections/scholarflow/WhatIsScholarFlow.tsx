import { SectionHeader } from '@/components/SectionHeader';
import { TextSplit } from '@/components/motion/TextSplit';
import { SCHOLARFLOW_INTRO } from '@/lib/content/scholarflow';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';

/**
 * Plainly answers "what is ScholarFlow?" for a first-time visitor, making the
 * category-not-a-product idea unmistakable (the Amazon-aisle mental model).
 * The founder's positioning line gets its own typographic moment: a large
 * serif line arriving word by word out of a mask, with "It is a category."
 * landing in gold as the payoff. Wording is verbatim; only the stage changed.
 */
export function WhatIsScholarFlow() {
  return (
    <section id="what" className="relative z-[2] py-[110px]">
      <Container>
        <SectionHeader
          align="left"
          eyebrow={SCHOLARFLOW_INTRO.eyebrow}
          title={
            <>
              What Is <em className="not-italic text-gold-lt">ScholarFlow?</em>
            </>
          }
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
          className="mb-12"
        />

        {/* The positioning line, given room to breathe. */}
        <p className="max-w-3xl font-display text-[clamp(1.85rem,3.6vw,3rem)] font-light leading-[1.25] text-ivory">
          <TextSplit text="ScholarFlow is not one app." by="word" mask />{' '}
          <TextSplit
            text="It is a category."
            by="word"
            mask
            delay={0.4}
            className="text-gold-lt"
          />
        </p>

        <div className="mt-10 max-w-2xl space-y-5 text-base leading-relaxed text-ivory-dim md:text-lg">
          <Reveal>
            <p>
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
              <strong className="font-medium text-ivory">GraceFlow</strong> is live today, with{' '}
              <strong className="font-medium text-ivory">LearnFlow</strong>, its deep-study tier,
              inside. More are coming, in their own time.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
