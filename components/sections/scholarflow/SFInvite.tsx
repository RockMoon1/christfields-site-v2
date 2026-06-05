import Link from 'next/link';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { MagneticButton } from '../../motion/MagneticButton';

/**
 * Closing beat for the ScholarFlow category page: the shelf keeps growing.
 * Points people to the waitlist (to hear when the next tool opens) and to the
 * curated resources, without pretending more products exist than do.
 */
export function SFInvite() {
  return (
    <section id="invite" className="relative z-[2] py-[120px]">
      <Container className="text-center">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            More on the way
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mx-auto mb-6 max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.12] text-ivory">
            The shelf keeps <em className="not-italic text-gold-lt">growing.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-silver md:text-lg">
            GraceFlow and LearnFlow are here today. More tools are being built, carefully, without
            rushing. Leave your email and we will tell you when the next one opens.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
            <MagneticButton>
              <Link
                href="/#join"
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-7 py-3.5 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
              >
                Tell me what is next &rarr;
              </Link>
            </MagneticButton>
            <Link
              href="/scholarflow-resources"
              className="text-xs font-medium uppercase tracking-[0.16em] text-silver underline-offset-4 transition-colors hover:text-gold-lt hover:underline"
            >
              Trusted resources
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
