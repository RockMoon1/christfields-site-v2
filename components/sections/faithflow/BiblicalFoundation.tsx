import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { CardSpotlight } from '../../motion/CardSpotlight';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';

interface ScriptureCard {
  ref: string;
  quote: string;
  tag: string;
}

const scriptures: ScriptureCard[] = [
  {
    ref: 'Proverbs 27:17',
    quote: 'As iron sharpens iron, so one person sharpens another.',
    tag: 'Mutual sharpening',
  },
  {
    ref: 'Hebrews 10:24-25',
    quote:
      'And let us consider how we may spur one another on toward love and good deeds... not giving up meeting together.',
    tag: 'Gathering together',
  },
  {
    ref: 'Galatians 6:2',
    quote: "Carry each other's burdens, and in this way you will fulfill the law of Christ.",
    tag: 'Bearing burdens',
  },
  {
    ref: 'Acts 2:42',
    quote:
      "They devoted themselves to the apostles' teaching and to fellowship, to the breaking of bread and to prayer.",
    tag: 'Devoted community',
  },
  {
    ref: 'Ecclesiastes 4:9-10',
    quote: 'Two are better than one... If either of them falls down, one can help the other up.',
    tag: 'Mutual support',
  },
];

export function BiblicalFoundation() {
  return (
    <section
      id="scripture"
      className="relative z-[2] bg-black-2 py-[110px]"
    >
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Biblical Foundation
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            Rooted in <em className="not-italic text-gold-lt">Scripture.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            Every part of FaithFlow is grounded in what Scripture teaches about community,
            accountability, and walking together in faith.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {scriptures.map((s, i) => (
            <Reveal key={s.ref} delay={0.05 * i}>
              <CardSpotlight className="h-full rounded-sm" size={240}>
              <article className="group h-full rounded-sm border border-border-sub bg-gradient-to-b from-black-3 to-black-2 p-8 text-center transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-border-gold">
                <ScriptureSymbol className="mb-3 block text-2xl text-gold" delay={i * 0.05} />
                <cite className="mb-4 block text-[11px] not-italic uppercase tracking-[0.18em] text-gold">
                  {s.ref}
                </cite>
                <blockquote className="mb-6 font-display text-lg italic leading-relaxed text-ivory-dim">
                  &ldquo;{s.quote}&rdquo;
                </blockquote>
                <span className="inline-block rounded-sm border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gold-lt">
                  {s.tag}
                </span>
              </article>
              </CardSpotlight>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
