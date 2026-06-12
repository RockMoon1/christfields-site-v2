'use client';

import { motion } from 'motion/react';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { AnimatedDivider } from '../../motion/AnimatedDivider';
import { CardSpotlight } from '../../motion/CardSpotlight';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';
import { TextSplit } from '../../motion/TextSplit';

/**
 * Public-facing Future Leaders section. Intentionally soft.
 *
 * The actual leadership criteria (the checklist that could read as judgmental
 * to a casual visitor) is NOT shown here. It is shown only inside the success
 * card after someone selects "I'm interested in helping start a group" in the
 * Get Involved form. That keeps the surface friendly while the depth waits
 * for people who have already shown intent.
 *
 * The old md:sticky on the James 3:1 aside never engaged (the text column is
 * too short for stickiness to mean anything), so the aside is now a proper
 * Scripture moment instead: vertically centered against the copy, glass
 * surface, per-word verse reveal, a self-drawing hairline over the citation,
 * and a slow gold breath behind the symbol. The quote and citation are
 * verbatim.
 */
export function FutureLeaders() {
  return (
    <section id="leaders" className="relative z-[2] py-[110px]">
      <Container>
        <div className="grid items-center gap-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Looking Ahead"
              title={
                <>
                  Future <em className="not-italic text-gold-lt">Leaders.</em>
                </>
              }
              titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
              className="mb-6"
            />

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

          <Reveal variant="clip" delay={0.15}>
            <CardSpotlight className="rounded-sm">
            <aside className="cf-glass relative h-fit overflow-hidden rounded-sm p-8 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"
              />
              {/* Slow gold breath behind the symbol — presence, not spectacle. */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(201,165,72,0.18) 0%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />
              <ScriptureSymbol symbol="◈" className="relative mb-4 block font-display text-3xl text-gold" />
              <blockquote className="relative mb-4 font-display text-lg italic leading-relaxed text-ivory-dim">
                <TextSplit
                  text={'“Not many of you should become teachers, my brothers and sisters, because you know that we who teach will be judged more strictly.”'}
                  by="word"
                  mask
                  delay={0.25}
                />
              </blockquote>
              <AnimatedDivider className="mx-auto mb-3 w-16" />
              <cite className="relative text-[11px] not-italic uppercase tracking-[0.18em] text-gold">
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
