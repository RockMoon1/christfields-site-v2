import { Container } from '../Container';
import { Reveal } from '../Reveal';

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

export function Values() {
  return (
    <section id="values" className="bg-black-2 py-[110px]">
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            What We Stand On
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-14 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            Core <em className="not-italic text-gold-lt">Values.</em>
          </h2>
        </Reveal>

        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.name} delay={0.05 * (i + 1)}>
              <div className="group cursor-default border-l border-border-gold pl-6 transition-[border-color,padding] duration-500 hover:border-gold hover:pl-7">
                <div
                  aria-hidden
                  className="mb-4 h-px w-12 bg-gold shadow-[0_0_0_rgba(201,165,72,0)] transition-[width,box-shadow] duration-500 group-hover:w-24 group-hover:shadow-[0_0_12px_rgba(201,165,72,0.5)]"
                />
                <h3 className="mb-3 font-display text-2xl font-light text-ivory transition-colors duration-300 group-hover:text-gold-lt">
                  {value.name}
                </h3>
                <p className="text-sm leading-relaxed text-silver transition-colors duration-300 group-hover:text-ivory-dim">
                  {value.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
