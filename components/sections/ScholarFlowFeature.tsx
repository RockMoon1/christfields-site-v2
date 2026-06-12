import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { Button } from '../Button';
import { CardSpotlight } from '../motion/CardSpotlight';
import { ScholarFlowPreview } from '../motion/ScholarFlowPreview';
import { TiltCard } from '../motion/TiltCard';

/**
 * Homepage preview of ScholarFlow. ScholarFlow is a CATEGORY (a shelf of faith +
 * study tools), not a single product, so this section invites people to explore
 * the shelf rather than sign up for one app. The full storefront is at
 * /scholarflow.
 *
 * The copy column opens with the shared SectionHeader entrance; the preview
 * composite (TiltCard + CardSpotlight + ScholarFlowPreview) stays as-is and is
 * unveiled with the clip-path card grammar.
 */
export function ScholarFlowFeature() {
  return (
    <section
      id="scholarflow"
      className="relative overflow-hidden bg-black-2 py-[110px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_center,rgba(45,106,79,0.12),transparent_65%)]"
      />

      <Container>
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_1fr]">
          <div>
            <SectionHeader
              align="left"
              eyebrow="The ScholarFlow shelf"
              title={
                <>
                  Scholar<em className="not-italic text-gold-lt">Flow.</em>
                </>
              }
              lede="ScholarFlow is not one app. It is the shelf where our faith and study tools live. Browse the collection and pick the one that fits. GraceFlow and LearnFlow are open right now, with more on the way."
              className="mb-6"
              ledeClassName="max-w-xl"
            />

            <Reveal delay={0.1}>
              <div className="mb-8 flex flex-wrap gap-2">
                {['GraceFlow', 'LearnFlow', 'More coming'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-border-sub bg-black-4 px-3 py-1 text-xs tracking-wider text-ivory-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mb-6 flex flex-wrap gap-3">
                <Button href="/scholarflow">Explore ScholarFlow &rarr;</Button>
                <Button href="/scholarflow-resources" variant="ghost">
                  Trusted Resources &rarr;
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-sm text-muted">
                A <strong className="text-ivory-dim">Christ Fields</strong> category. A growing shelf,
                built on faith and discipline.
              </p>
            </Reveal>
          </div>

          <Reveal variant="clip" delay={0.15}>
            <TiltCard max={4}>
              <CardSpotlight className="rounded-sm" size={460} intensity={0.16}>
                <ScholarFlowPreview />
              </CardSpotlight>
            </TiltCard>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
