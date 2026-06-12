'use client';

import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { SCHOLARFLOW_PRODUCTS, type SFProduct } from '@/lib/content/scholarflow';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { GlowCard } from '../../motion/GlowCard';
import { TiltCard } from '../../motion/TiltCard';

/**
 * The storefront shelf: one animated card per product (GraceFlow, LearnFlow).
 * Cards are the family's glass material (.cf-glass) unveiled with a clip-path
 * reveal, tilting in 3D toward the cursor (TiltCard) under a warm cursor glow
 * (GlowCard). Feature bullets stagger in one by one, the "Live now" dot
 * breathes gently, and the price gets large serif numerals. Every claim,
 * price, and tagline renders verbatim from lib/content/scholarflow. A giant
 * outlined watermark sits behind the shelf for depth without noise.
 */
export function ProductShelf() {
  return (
    <section id="products" className="relative z-[2] overflow-hidden py-[110px]">
      {/* Ghost wordmark behind the shelf — outline only, never competing. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-6 -z-10 select-none overflow-hidden"
      >
        <span className="cf-outline-text block whitespace-nowrap text-center font-display text-[clamp(6rem,17vw,15rem)] font-light leading-none opacity-60">
          ScholarFlow
        </span>
      </div>

      <Container>
        <SectionHeader
          align="left"
          eyebrow="The shelf"
          title={
            <>
              The <em className="not-italic text-gold-lt">tools.</em>
            </>
          }
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
          lede="Two apps are live today. Tap in and use them now, free to start. More are on the way."
          ledeClassName="text-silver"
          className="mb-14"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {SCHOLARFLOW_PRODUCTS.map((p, i) => (
            <Reveal
              key={p.key}
              variant="clip"
              delay={Math.min(i * 0.12, 0.3)}
              className="h-full"
            >
              <div className="h-full [perspective:1200px]">
                <TiltCard max={5} className="h-full">
                  <ProductCard product={p} />
                </TiltCard>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProductCard({ product: p }: { product: SFProduct }) {
  return (
    <GlowCard glowColor={p.glow} glowSize={340} className="cf-glass h-full rounded-md">
      <div className="flex h-full flex-col p-8 md:p-10">
        {/* Mark + live status */}
        <div className="mb-6 flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-border-gold bg-gold/[0.07] font-display text-xl text-gold-lt">
            {p.mark}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-lt/40 bg-emerald-lt/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-bright">
            <span
              aria-hidden
              className="h-1.5 w-1.5 animate-[ffPulse_2.4s_ease-in-out_infinite] rounded-full bg-emerald-bright"
            />
            {p.statusLabel}
          </span>
        </div>

        <h3 className="font-display text-3xl font-light text-ivory">{p.name}</h3>
        <p className="mt-2 text-base italic text-gold-lt">{p.tagline}</p>

        <p className="mt-4 leading-relaxed text-ivory-dim">{p.description}</p>
        <p className="mt-3 text-sm text-silver">{p.forWho}</p>

        <ul className="mt-6 space-y-2.5">
          {p.features.map((f, i) => (
            <Reveal
              key={f}
              as="li"
              delay={0.15 + i * 0.07}
              y={10}
              className="flex items-start gap-2.5 text-sm text-ivory-dim"
            >
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {f}
            </Reveal>
          ))}
        </ul>

        {p.note && <p className="mt-5 text-xs text-muted">{p.note}</p>}

        <div className="mt-auto pt-8">
          <div className="mb-5 flex items-baseline gap-2.5">
            <span className="font-display text-3xl font-light leading-none text-ivory md:text-4xl">
              {p.price}
            </span>
            {p.priceNote && <span className="text-xs text-muted">{p.priceNote}</span>}
          </div>
          <Button href={p.href}>
            {p.cta}
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Button>
        </div>
      </div>
    </GlowCard>
  );
}
