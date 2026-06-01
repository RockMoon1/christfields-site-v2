import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionSpotlight } from '../motion/SectionSpotlight';

/**
 * A horizontal-scroll showcase of the five practices the walk is built on (the
 * same areas the member dashboard tracks). Native scroll-snap so it is reliable
 * on touch, trackpad, and mouse, edge-faded so cards emerge and dissolve, with a
 * cursor spotlight on the section behind it.
 */

interface Practice {
  name: string;
  line: string;
  body: string;
  ref: string;
  color: string;
}

const PRACTICES: Practice[] = [
  {
    name: 'Presence',
    line: 'Show up, in person.',
    body: 'The gathering is the heartbeat, not the screen. Community needs your presence, not just your attention.',
    ref: 'Hebrews 10:25',
    color: '#c9a548',
  },
  {
    name: 'Honesty',
    line: 'The truth about your week.',
    body: 'You cannot fake your way through a group like this. The people next to you eventually know, and that is the point.',
    ref: 'Psalm 51:6',
    color: '#2d6a4f',
  },
  {
    name: 'Scripture',
    line: 'Sit under the Word.',
    body: 'Read slowly, together. Let Scripture be bigger than a single verse, and let it read you back.',
    ref: 'Psalm 119:105',
    color: '#e4c97a',
  },
  {
    name: 'Prayer',
    line: 'Bring him everything.',
    body: 'Not to twist his arm, but to hand it to one who is good. Praying for each other by name changes things.',
    ref: 'Philippians 4:6',
    color: '#5b8db8',
  },
  {
    name: 'Sharpening',
    line: 'Push each other forward.',
    body: 'As iron sharpens iron, so one person sharpens another. Friction, sometimes. Always toward growth.',
    ref: 'Proverbs 27:17',
    color: '#c47b3c',
  },
];

export function PracticesScroll() {
  return (
    <section className="relative overflow-hidden py-[110px]">
      <SectionSpotlight color="rgba(201, 165, 72, 0.08)" size={520} />

      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            What the walk is made of
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mb-4 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            Five <em className="not-italic text-gold-lt">practices.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-10 flex max-w-2xl items-center gap-3 text-base leading-relaxed text-silver md:text-lg">
            The ordinary things we keep returning to. Faithfulness, not perfection.
            <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-muted md:inline">
              Scroll &rarr;
            </span>
          </p>
        </Reveal>
      </Container>

      {/* Edge-faded horizontal scroller. */}
      <div
        className="relative"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        }}
      >
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-7 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PRACTICES.map((p, i) => (
            <Reveal key={p.name} delay={Math.min(i * 0.06, 0.3)} className="shrink-0 snap-start">

              <article
                className="group relative flex h-full w-[78vw] flex-col overflow-hidden rounded-md border border-border-sub bg-black-2 p-8 transition-colors duration-300 hover:border-border-gold sm:w-[20rem]"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 16px ${p.color}66` }}
                />
                <span
                  aria-hidden
                  className="mb-6 inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 12px ${p.color}` }}
                />
                <h3 className="font-display text-3xl font-light text-ivory">{p.name}</h3>
                <p className="mt-2 font-display text-lg italic text-ivory-dim">{p.line}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-silver">{p.body}</p>
                <p
                  className="mt-6 text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: p.color }}
                >
                  {p.ref}
                </p>
              </article>
            </Reveal>
          ))}
          {/* Tail spacer so the last card can snap clear of the right edge. */}
          <span aria-hidden className="block w-2 shrink-0" />
        </div>
      </div>
    </section>
  );
}
