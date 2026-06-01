import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { CardSpotlight } from '../motion/CardSpotlight';
import { ScriptureSymbol } from '../motion/ScriptureSymbol';
import { MorphBlob } from '../motion/MorphBlob';

export function Vision() {
  return (
    <section id="vision" className="relative overflow-hidden py-[110px]">
      {/* Ambient morphing blobs for depth */}
      <MorphBlob color="rgba(201, 165, 72, 0.04)" size={600} className="-left-40 -top-20" />
      <MorphBlob color="rgba(27, 67, 50, 0.06)" size={450} className="-bottom-32 -right-32" />
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            The Mission
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-12 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            Built on faith.<br />
            <em className="not-italic text-gold-lt">Grounded in truth.</em>
          </h2>
        </Reveal>

        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr]">
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

          <Reveal delay={0.15}>
            <CardSpotlight className="rounded-sm">
            <aside className="relative h-fit overflow-hidden rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-8 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"
              />
              <ScriptureSymbol className="mb-4 block font-display text-3xl text-gold" />
              <blockquote className="mb-4 font-display text-xl italic leading-relaxed text-ivory-dim">
                &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
              </blockquote>
              <cite className="text-xs not-italic uppercase tracking-[0.18em] text-gold">
                Proverbs 27:17
              </cite>
            </aside>
            </CardSpotlight>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
