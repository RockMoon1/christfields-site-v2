import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { TextSplit } from '../motion/TextSplit';
import { TiltCard } from '../motion/TiltCard';
import { CardSpotlight } from '../motion/CardSpotlight';
import { ScriptureSymbol } from '../motion/ScriptureSymbol';
import { MorphBlob } from '../motion/MorphBlob';

/**
 * The Mission section. Copy is preserved verbatim; the presentation is the
 * editorial moment of the opening: the shared SectionHeader entrance, body
 * copy on a soft rise, and the Proverbs 27:17 pull-quote elevated into a
 * tilting glass card whose verse arrives word by word. Deliberately given
 * more vertical air than its neighbors so the pull-quote can breathe.
 */
export function Vision() {
  return (
    <section id="vision" className="relative overflow-hidden py-[140px] md:py-[170px]">
      {/* Ambient morphing blobs for depth */}
      <MorphBlob color="rgba(201, 165, 72, 0.04)" size={600} className="-left-40 -top-20" />
      <MorphBlob color="rgba(27, 67, 50, 0.06)" size={450} className="-bottom-32 -right-32" />
      <Container>
        <SectionHeader
          align="left"
          eyebrow="The Mission"
          title={
            <>
              Built on faith.
              <br />
              <em className="not-italic text-gold-lt">Grounded in truth.</em>
            </>
          }
          className="mb-16 md:mb-20"
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
        />

        <div className="grid gap-14 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-16">
          <div className="flex flex-col gap-5 text-base leading-relaxed text-ivory-dim md:text-lg">
            <Reveal>
              <p>
                We build at the meeting point of{' '}
                <strong className="font-medium text-ivory">faith and technology</strong>: tools meant
                to genuinely serve people and point them toward what is good, not to distract and
                diminish.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p>
                It is for people who want more than another app. People who want to grow in
                faithfulness, think clearly, and live with real integrity, because{' '}
                <em className="text-gold-lt">
                  we become wiser and more faithful when we walk alongside each other with honesty.
                </em>
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15} variant="clip">
            <TiltCard max={5}>
              <CardSpotlight className="rounded-sm">
                <aside className="cf-glass relative h-fit overflow-hidden rounded-sm p-8 text-center md:p-10">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"
                  />
                  <ScriptureSymbol className="mb-4 block font-display text-3xl text-gold" />
                  <blockquote className="mb-4 font-display text-xl italic leading-relaxed text-ivory-dim">
                    <TextSplit
                      text={'“As iron sharpens iron, so one person sharpens another.”'}
                      by="word"
                      blur={false}
                      delay={0.3}
                    />
                  </blockquote>
                  <cite className="text-xs not-italic uppercase tracking-[0.18em] text-gold">
                    Proverbs 27:17
                  </cite>
                </aside>
              </CardSpotlight>
            </TiltCard>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
