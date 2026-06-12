'use client';

import { motion } from 'motion/react';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { GlowCard } from '../motion/GlowCard';

/**
 * The five core values as an editorial list. Each entry carries a ghost roman
 * numeral in outlined type, a gold hairline that draws itself in as the item
 * enters the viewport (the family's connective-tissue gesture), and a quiet
 * hover response: a soft cursor-following gold radial, a slight lift, and the
 * title brightening. All five value statements are doctrinal-adjacent
 * commitments and stay verbatim.
 */

interface Value {
  name: string;
  body: string;
}

const values: Value[] = [
  {
    name: 'Faith',
    body: 'Everything we build begins with a commitment to what is true and good. Technology should serve people faithfully, point them toward wisdom, and not be used to exploit or distract them.',
  },
  {
    name: 'Discipline',
    body: 'Growth requires effort. We build for people willing to do the steady, unglamorous work of living faithfully day after day. No shortcuts, and no pretending otherwise.',
  },
  {
    name: 'Wisdom',
    body: 'We move carefully, not just quickly. We build what is genuinely needed, not what is currently popular. Rooted in scripture. Tested against reality.',
  },
  {
    name: 'Growth',
    body: 'Real growth happens through honesty, accountability, and faithfulness in small things over time. We build for people who are serious about that kind of long-term change.',
  },
  {
    name: 'Technology',
    body: 'We are builders. Technology is a tool, nothing more. Used with wisdom and honest intent, it can serve people well. Used without either, it becomes a source of harm.',
  },
];

const NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

export function Values() {
  return (
    <section id="values" className="bg-black-2 py-[110px]">
      <Container>
        <SectionHeader
          align="left"
          eyebrow="What We Stand On"
          title={
            <>
              <span className="text-gold-lt">5</span> Core{' '}
              <em className="not-italic text-gold-lt">Values.</em>
            </>
          }
          className="mb-14"
        />

        <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.name} delay={Math.min(0.06 * i, 0.3)} className="h-full">
              <GlowCard
                glowColor="rgba(201, 165, 72, 0.10)"
                glowSize={260}
                className="group h-full cursor-default rounded-sm transition-transform duration-500 hover:-translate-y-1"
              >
                <div className="relative h-full px-6 pb-6 pt-12">
                  {/* Ghost numeral in outlined type — visible at rest everywhere. */}
                  <span
                    aria-hidden
                    className="cf-outline-text pointer-events-none absolute right-4 top-1 select-none font-display text-7xl font-light leading-none"
                  >
                    {NUMERALS[i]}
                  </span>

                  {/* Gold hairline draws itself in as the item enters view. */}
                  <motion.span
                    aria-hidden
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                    transition={{
                      duration: 1,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.15 + i * 0.08,
                    }}
                    style={{ transformOrigin: 'left center' }}
                    className="mb-5 block h-px bg-gradient-to-r from-gold/80 via-gold/35 to-transparent"
                  />

                  <h3 className="mb-3 font-display text-2xl font-light text-ivory transition-colors duration-300 group-hover:text-gold-lt">
                    {value.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-silver transition-colors duration-300 group-hover:text-ivory-dim">
                    {value.body}
                  </p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
