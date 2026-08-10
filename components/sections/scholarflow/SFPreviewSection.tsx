import { Container } from '@/components/Container';
import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { CardSpotlight } from '@/components/motion/CardSpotlight';
import { ScholarFlowPreview } from '@/components/motion/ScholarFlowPreview';

/**
 * A feel for the tools: the Focus Command preview, moved here from the
 * homepage (2026-08-09) so the front page stays simple and the storefront
 * carries its own demonstration. The preview is clickable with local state
 * only; the copy stays short because WhatIsScholarFlow and ProductShelf
 * already explain the shelf.
 */
export function SFPreviewSection() {
  return (
    <section id="preview" className="relative overflow-hidden bg-black-2 py-[110px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_center,rgba(45,106,79,0.12),transparent_65%)]"
      />

      <Container>
        <div className="grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              align="left"
              eyebrow="A feel for it"
              title={
                <>
                  The shape of a <em className="not-italic text-gold-lt">tool.</em>
                </>
              }
              lede="This is the shape of a ScholarFlow tool: a calm plan, honest progress, and one clear next thing. Click around the preview. Nothing is tracked or saved."
              className="mb-6"
              ledeClassName="max-w-xl"
            />

            <Reveal delay={0.15}>
              <p className="text-sm text-muted">
                The real tools live on the shelf below. GraceFlow is open today, with LearnFlow
                inside it.
              </p>
            </Reveal>
          </div>

          <Reveal variant="clip" delay={0.15}>
            <CardSpotlight className="rounded-sm" size={460} intensity={0.16}>
              <ScholarFlowPreview />
            </CardSpotlight>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
