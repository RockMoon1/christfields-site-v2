import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { AnimatedDivider } from '../../motion/AnimatedDivider';
import { CardSpotlight } from '../../motion/CardSpotlight';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';
import { TextSplit } from '../../motion/TextSplit';

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

/**
 * One scripture rendered as a Scripture moment: the verse arrives word by
 * word at reading pace, a gold hairline draws itself, and the reference
 * settles beneath it. Verse text, reference, and tag are character-for-
 * character verbatim — only the container and the entrance changed.
 */
function ScriptureMoment({
  scripture,
  featured = false,
  index = 0,
}: {
  scripture: ScriptureCard;
  featured?: boolean;
  index?: number;
}) {
  return (
    <CardSpotlight className="h-full rounded-sm" size={featured ? 380 : 240}>
      <article
        className={`cf-glass group h-full rounded-sm text-center transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-gold/40 ${
          featured ? 'p-10 md:p-14' : 'p-8'
        }`}
      >
        <ScriptureSymbol
          className={`mb-4 block text-gold ${featured ? 'text-3xl' : 'text-2xl'}`}
          delay={index * 0.05}
        />
        <blockquote
          className={`mb-6 font-display italic leading-relaxed text-ivory-dim ${
            featured ? 'mx-auto max-w-2xl text-2xl md:text-3xl md:leading-snug' : 'text-lg'
          }`}
        >
          <TextSplit
            text={`“${scripture.quote}”`}
            by="word"
            mask
            delay={featured ? 0.2 : 0.1 + index * 0.05}
          />
        </blockquote>
        <AnimatedDivider className={`mx-auto mb-4 ${featured ? 'w-24' : 'w-16'}`} />
        <cite className="mb-4 block text-[11px] not-italic uppercase tracking-[0.18em] text-gold">
          {scripture.ref}
        </cite>
        <span className="inline-block rounded-sm border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gold-lt">
          {scripture.tag}
        </span>
      </article>
    </CardSpotlight>
  );
}

/**
 * Biblical Foundation: five Scripture moments. The brand verse (Proverbs
 * 27:17) leads as a full-width centerpiece; the remaining four follow in a
 * two-by-two rhythm, each unveiling with the clip entrance in sequence.
 * Scripture is visually elevated above the operational sections around it:
 * glass surfaces, per-word verse reveals, and self-drawing gold hairlines
 * under each reference.
 */
export function BiblicalFoundation() {
  const [featured, ...rest] = scriptures;

  return (
    <section id="scripture" className="relative z-[2] bg-black-2 py-[110px]">
      <Container>
        <SectionHeader
          eyebrow="Biblical Foundation"
          title={
            <>
              Rooted in <em className="not-italic text-gold-lt">Scripture.</em>
            </>
          }
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
          lede="Every part of FaithFlow is grounded in what Scripture teaches about community, accountability, and walking together in faith."
          ledeClassName="text-silver"
          className="mb-14"
        />

        <Reveal variant="clip" className="mb-5">
          <ScriptureMoment scripture={featured} featured />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {rest.map((s, i) => (
            <Reveal key={s.ref} variant="clip" delay={0.08 * i}>
              <ScriptureMoment scripture={s} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
