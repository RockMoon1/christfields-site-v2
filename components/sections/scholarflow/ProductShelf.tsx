'use client';

import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { GlowCard } from '../../motion/GlowCard';
import { TiltCard } from '../../motion/TiltCard';
import { SCHOLARFLOW_PRODUCTS, type SFProduct } from '@/lib/content/scholarflow';

/**
 * The storefront shelf: one animated card per product (GraceFlow, LearnFlow).
 * Each card tilts in 3D toward the cursor (TiltCard) and carries a warm cursor
 * glow (GlowCard), so the shelf reads as a premium, living showcase. The card's
 * action is an external link into the live app.
 */
export function ProductShelf() {
  return (
    <section id="products" className="relative z-[2] py-[110px]">
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            The shelf
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            The <em className="not-italic text-gold-lt">tools.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            Two apps are live today. Tap in and use them now, free to start. More are on the way.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {SCHOLARFLOW_PRODUCTS.map((p, i) => (
            <Reveal key={p.key} delay={Math.min(i * 0.08, 0.3)}>
              <div className="h-full [perspective:1200px]">
                <TiltCard max={6} className="h-full">
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
    <GlowCard
      glowColor={p.glow}
      glowSize={340}
      className="h-full rounded-md border border-border-sub bg-black-2 transition-colors duration-300 hover:border-border-gold"
    >
      <div className="flex h-full flex-col p-8 md:p-10">
        {/* Mark + live status */}
        <div className="mb-6 flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-border-gold bg-gold/[0.07] font-display text-xl text-gold-lt">
            {p.mark}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-lt/40 bg-emerald-lt/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-bright">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-bright" />
            {p.statusLabel}
          </span>
        </div>

        <h3 className="font-display text-3xl font-light text-ivory">{p.name}</h3>
        <p className="mt-2 text-base italic text-gold-lt">{p.tagline}</p>

        <p className="mt-4 leading-relaxed text-ivory-dim">{p.description}</p>
        <p className="mt-3 text-sm text-silver">{p.forWho}</p>

        <ul className="mt-6 space-y-2">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-ivory-dim">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {f}
            </li>
          ))}
        </ul>

        {p.note && <p className="mt-5 text-xs text-muted">{p.note}</p>}

        <div className="mt-auto pt-8">
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-display text-2xl text-ivory">{p.price}</span>
            {p.priceNote && <span className="text-xs text-muted">{p.priceNote}</span>}
          </div>
          <a
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
          >
            {p.cta} &rarr;
          </a>
        </div>
      </div>
    </GlowCard>
  );
}
