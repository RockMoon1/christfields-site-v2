import Link from 'next/link';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { SCHOLARFLOW_PRODUCTS } from '@/lib/content/scholarflow';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { ScriptureSymbol } from '../../motion/ScriptureSymbol';

/**
 * Hero for the ScholarFlow CATEGORY page. Frames ScholarFlow as a shelf of
 * tools (not a single product). The heading now rises out of a mask at
 * editorial scale via SectionHeader, and a small glass "shelf" of the live
 * products stands beside it, so the storefront shows real product from the
 * very first screen instead of text on a gradient. All product names,
 * taglines, and status labels come verbatim from lib/content/scholarflow.
 */
export function SFHero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[88vh] items-center overflow-hidden pb-20 pt-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 72% 18%, rgba(201,165,72,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 8% 92%, rgba(45,106,79,0.14) 0%, transparent 55%),
            #060908
          `,
        }}
      />
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeader
              as="h1"
              align="left"
              eyebrow="A Christ Fields category"
              title={
                <>
                  Scholar<em className="not-italic text-gold-lt">Flow.</em>
                </>
              }
              titleClassName="max-w-3xl text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.04]"
              lede="A growing shelf of faith and study tools. Open it, browse the apps, and pick the one that meets you where you are. Two are live right now."
              ledeClassName="max-w-xl text-lg md:text-xl"
            />
            <Reveal delay={0.45}>
              <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-4">
                <Button href="#products" className="px-7 py-3.5">
                  Browse the tools
                  <span
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </Button>
                <Link
                  href="/#projects"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-silver underline-offset-4 transition-colors hover:text-gold-lt hover:underline"
                >
                  See all fields
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.6}>
              <ScriptureSymbol className="mt-14 block text-2xl text-gold/70" />
            </Reveal>
          </div>

          {/* The shelf, miniature: the two live tools plus one empty slot,
              so "a growing shelf" is something you can see, not just read. */}
          <div className="relative hidden lg:block">
            <div className="space-y-5">
              {SCHOLARFLOW_PRODUCTS.map((p, i) => (
                <Reveal
                  key={p.key}
                  variant="clip"
                  delay={0.5 + i * 0.18}
                  className={i % 2 === 1 ? 'ml-10' : 'mr-10'}
                >
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cf-glass group flex items-center gap-5 rounded-md p-5 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <span
                      aria-hidden
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-border-gold bg-gold/[0.07] font-display text-xl text-gold-lt"
                    >
                      {p.mark}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-xl font-light text-ivory transition-colors group-hover:text-gold-lt">
                        {p.name}
                      </span>
                      <span className="block text-xs leading-relaxed text-ivory-dim">
                        {p.tagline}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-lt/40 bg-emerald-lt/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-bright">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 animate-[ffPulse_2.4s_ease-in-out_infinite] rounded-full bg-emerald-bright"
                      />
                      {p.statusLabel}
                    </span>
                  </a>
                </Reveal>
              ))}
              <Reveal variant="clip" delay={0.86} className="mr-10">
                <div className="flex items-center gap-5 rounded-md border border-dashed border-border-sub p-5 opacity-70">
                  <span
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-dashed border-border-sub font-display text-xl text-muted"
                  >
                    ·
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                    More on the way
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
