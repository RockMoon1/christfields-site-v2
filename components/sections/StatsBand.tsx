import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { CountUp } from '../motion/CountUp';

/**
 * A band of momentum: a few large figures that count up as they scroll into
 * view. Deliberately NOT vanity metrics (no inflated member counts). These are
 * honest, meaningful figures that say what Christ Fields actually is. Swap in
 * real numbers later by editing the items below.
 */

interface Stat {
  /** Numeric value to count up to, or null for a static display value. */
  value: number | null;
  display?: string; // used when value is null
  prefix?: string;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 100, suffix: '%', label: 'Known and prayed for by name' },
  { value: 4, label: 'Seasons of growth, from seed to fruit' },
  { value: null, display: '∞', label: 'Mercies, new every morning' },
  { value: null, display: '27:17', label: 'The proverb we are built on' },
];

export function StatsBand() {
  return (
    <section className="relative overflow-hidden py-[90px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(201,165,72,0.05) 0%, transparent 60%)',
        }}
      />
      <Container>
        <Reveal>
          <p className="mb-12 text-center text-xs font-medium uppercase tracking-[0.22em] text-gold">
            What this actually is
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4 md:gap-y-0">
          {STATS.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={i * 0.08}
              className={
                i < STATS.length - 1
                  ? 'px-4 text-center md:border-r md:border-border-sub/60'
                  : 'px-4 text-center'
              }
            >
              <p className="font-display text-5xl font-light leading-none text-gold-lt md:text-6xl">
                {stat.value !== null ? (
                  <CountUp to={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                ) : (
                  <span>{stat.display}</span>
                )}
              </p>
              <p className="mx-auto mt-4 max-w-[14rem] text-sm leading-relaxed text-silver">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
