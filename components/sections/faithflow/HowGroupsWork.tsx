import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { CardSpotlight } from '../../motion/CardSpotlight';

interface Step {
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    title: 'Small and Personal',
    body: 'Groups stay intentionally small. As interest grows, new groups may be formed with prayerful leadership and clear structure.',
  },
  {
    title: 'Named and Organized',
    body: 'Each group has its own name, identity, and character, while staying rooted in the same FaithFlow principles.',
  },
  {
    title: 'Led with Humility',
    body: 'Each group has leaders who serve humbly. Leaders guide and equip. They do not dominate or perform.',
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

export function HowGroupsWork() {
  return (
    <section id="how" className="relative z-[2] py-[110px]">
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            The Structure
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            How FaithFlow Groups <em className="not-italic text-gold-lt">Work.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            Groups stay small and intentional. Every detail serves the same goal. Faithful
            community, not performance.
          </p>
        </Reveal>

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={0.05 * i} as="li">
              <CardSpotlight className="h-full rounded-sm" size={220}>
              <article className="group relative h-full rounded-sm border border-border-sub bg-black-2 p-7 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-border-gold">
                <span
                  aria-hidden
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dk font-display text-base font-semibold text-black"
                >
                  {i + 1}
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
