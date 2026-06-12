import Link from 'next/link';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';

/**
 * Closing beat for the ScholarFlow category page: the shelf keeps growing.
 * Points people to the waitlist (to hear when the next tool opens) and to the
 * curated resources, without pretending more products exist than do. The
 * primary CTA is a commitment moment, so it carries the one-shot ember burst.
 */
export function SFInvite() {
  return (
    <section id="invite" className="relative z-[2] py-[120px]">
      <Container className="text-center">
        <SectionHeader
          eyebrow="More on the way"
          title={
            <>
              The shelf keeps <em className="not-italic text-gold-lt">growing.</em>
            </>
          }
          titleClassName="mx-auto max-w-2xl text-[clamp(2rem,4vw,3.25rem)] leading-[1.12]"
          lede="GraceFlow and LearnFlow are here today. More tools are being built, carefully, without rushing. Leave your email and we will tell you when the next one opens."
          ledeClassName="max-w-xl"
          className="mb-10"
        />
        <Reveal delay={0.3}>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4">
            <Button href="/#join" emberBurst className="px-7 py-3.5">
              Tell me what is next
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                &rarr;
              </span>
            </Button>
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
