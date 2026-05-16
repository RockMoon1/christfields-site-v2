import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';

/**
 * Phase 1 foundation page.
 *
 * This is intentionally minimal. The goal is to verify the visual system:
 * fonts, colors, the flame logo, the nav, the footer. Once you confirm
 * this looks right, Phase 2 ports the full home page content.
 */
export default function HomePage() {
  return (
    <>
      <Nav />

      <main className="pt-[var(--nav-h)]">
        {/* Hero placeholder */}
        <section className="flex min-h-[80vh] items-center justify-center py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-6 font-display text-xs uppercase tracking-[0.22em] text-gold">
                Phase 1 Foundation
              </p>
              <h1 className="mb-6 font-display text-5xl font-light leading-[1.05] text-ivory md:text-7xl">
                Iron Sharpens <em className="not-italic text-gold-lt">Iron.</em>
              </h1>
              <p className="mb-3 text-lg text-silver md:text-xl">
                Christ Fields v2 is being rebuilt with Next.js, TypeScript, Tailwind v4, and Framer Motion.
              </p>
              <p className="font-display text-base italic text-silver">
                &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
              </p>

              <div className="mt-12 flex flex-wrap justify-center gap-3">
                <a
                  href="https://christfields2717.com"
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/45 bg-transparent px-5 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  Current Live Site &rarr;
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* Design system preview so we can verify tokens render correctly */}
        <section className="border-t border-border-sub py-20">
          <Container>
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-gold">Design System</p>
            <h2 className="mb-12 font-display text-4xl font-light text-ivory">
              Tokens preserved from <em className="text-gold-lt">v1.</em>
            </h2>

            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">Colors</h3>
                <div className="grid grid-cols-4 gap-3">
                  <Swatch name="Black" hex="#060908" />
                  <Swatch name="Black 2" hex="#0C110E" />
                  <Swatch name="Black 3" hex="#131A16" />
                  <Swatch name="Black 4" hex="#1A221D" />
                  <Swatch name="Gold" hex="#C9A548" />
                  <Swatch name="Gold Lt" hex="#E4C97A" />
                  <Swatch name="Gold Dk" hex="#7A6228" />
                  <Swatch name="Emerald" hex="#1B4332" />
                  <Swatch name="Em Lt" hex="#2D6A4F" />
                  <Swatch name="Ivory" hex="#F0F2EE" />
                  <Swatch name="Silver" hex="#8A9A92" />
                  <Swatch name="Muted" hex="#4E5E57" />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">Typography</h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">Display (Cormorant Garamond)</p>
                    <p className="font-display text-4xl font-light text-ivory">As iron sharpens iron.</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">Display Italic</p>
                    <p className="font-display text-3xl italic text-gold-lt">So one person sharpens another.</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">Body (Inter)</p>
                    <p className="text-base text-ivory-dim">
                      Christ Fields exists at the intersection of faith and technology. We build tools that
                      genuinely serve people.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">Section Label</p>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">The Mission</p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div>
      <div
        className="aspect-square w-full rounded-sm border border-border-sub"
        style={{ background: hex }}
      />
      <p className="mt-1.5 text-xs font-medium text-ivory">{name}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted">{hex}</p>
    </div>
  );
}
