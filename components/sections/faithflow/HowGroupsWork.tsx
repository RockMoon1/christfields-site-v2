import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { CardSpotlight } from '../../motion/CardSpotlight';

interface Step {
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    title: 'Small and Personal',
    body: 'Small groups stay intentionally small. As Iron and Ember grows, new small groups form within it, each with prayerful leadership and clear structure.',
  },
  {
    title: 'One Shared Identity',
    body: 'Iron and Ember is the one name everyone shares. The small groups within it carry the same character, rooted in the same FaithFlow principles.',
  },
  {
    title: 'Led with Humility',
    body: 'Each small group is led by two leaders together, never one alone. They guide and equip. They do not dominate or perform.',
  },
  {
    title: 'Scripture-Rooted',
    body: 'Scripture and accountability guide everything. The Bible is the foundation, not an afterthought.',
  },
  {
    title: 'Faithful Community',
    body: 'The goal is faithful community. Not hype, not growth metrics, not performance. Real people doing real life together.',
  },
];

/**
 * The five FaithFlow principles. Cards unveil with the clip-path entrance in
 * reading order, each numbered with an oversized editorial numeral instead
 * of the old circled badge. The grid is intentionally 3 + 2: the last two
 * principles widen to fill the row, so the layout reads as a deliberate
 * cadence rather than an orphaned wrap. Principle bodies reflect the
 * 2026-08-09 restructure: Iron and Ember is the one community, small
 * groups form within it.
 */
export function HowGroupsWork() {
  return (
    <section id="how" className="relative z-[2] py-[110px]">
      <Container>
        <SectionHeader
          align="left"
          eyebrow="The Structure"
          title={
            <>
              How FaithFlow Groups <em className="not-italic text-gold-lt">Work.</em>
            </>
          }
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
          lede="One community, Iron and Ember. Within it, small groups stay small and intentional. Every detail serves the same goal. Faithful community, not performance."
          ledeClassName="text-silver"
          className="mb-14"
        />

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {steps.map((step, i) => (
            <Reveal
              key={step.title}
              variant="clip"
              delay={0.08 * i}
              as="li"
              className={i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}
            >
              <CardSpotlight className="h-full rounded-sm" size={220}>
              <article className="group relative h-full overflow-hidden rounded-sm border border-border-sub bg-black-2 p-7 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-border-gold">
                <span
                  aria-hidden
                  className="cf-outline-text pointer-events-none absolute -right-2 -top-5 font-display text-[5.5rem] font-light leading-none transition-opacity duration-300 md:opacity-60 md:group-hover:opacity-100"
                >
                  {`0${i + 1}`}
                </span>
                <span
                  aria-hidden
                  className="mb-4 block font-display text-2xl font-light text-gold"
                >
                  {`0${i + 1}`}
                </span>
                <h3 className="mb-2 font-display text-2xl font-light text-ivory">{step.title}</h3>
                <p className="text-sm leading-relaxed text-silver">{step.body}</p>
              </article>
              </CardSpotlight>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
