import Link from 'next/link';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { SectionHeader } from '@/components/SectionHeader';

export interface Resource {
  name: string;
  desc: string;
  url: string;
}

interface ResourcePageProps {
  eyebrow: string;
  titleLine1: string;
  /** Italic gold line that closes the heading */
  titleLine2: string;
  description: string;
  resources: Resource[];
}

/**
 * Shared layout used by both /faithflow-resources and /scholarflow-resources.
 * The header uses the family SectionHeader (h1, masked rise, drawing rule)
 * over a soft gold-and-emerald atmosphere so the page belongs to the same
 * world as the rest of the site. Resources render as a numbered editorial
 * index: oversized gold numerals, staggered entrances, and a transform-based
 * hover lift (no layout shift). Resource names, descriptions, and URLs pass
 * through verbatim.
 */
export function ResourcePage({
  eyebrow,
  titleLine1,
  titleLine2,
  description,
  resources,
}: ResourcePageProps) {
  return (
    <main id="main" className="pt-[var(--nav-h)]">
      <section className="relative overflow-hidden border-b border-border-sub py-[90px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse at 18% 0%, rgba(201, 165, 72, 0.07) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 100%, rgba(45, 106, 79, 0.12) 0%, transparent 60%)
            `,
          }}
        />
        <Container>
          <Reveal>
            <Link
              href="/#projects"
              className="mb-12 inline-flex items-center text-xs font-medium uppercase tracking-[0.16em] text-silver transition-colors hover:text-gold-lt"
            >
              &larr; Back to Projects
            </Link>
          </Reveal>

          <SectionHeader
            align="left"
            as="h1"
            eyebrow={eyebrow}
            title={
              <>
                {titleLine1}
                <br />
                <em className="not-italic text-gold-lt">{titleLine2}</em>
              </>
            }
            titleClassName="text-[clamp(2.6rem,5vw,4rem)] leading-[1.05]"
            lede={description}
            ledeClassName="text-silver"
          />
        </Container>
      </section>

      <section className="py-[80px]">
        <Container>
          <ul className="border-t border-border-sub">
            {resources.map((r, i) => (
              <Reveal key={r.url} delay={0.06 * Math.min(i, 6)} as="li">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 border-b border-border-sub py-7 transition-colors duration-200 hover:bg-gold/[0.04] md:gap-7"
                >
                  <span
                    aria-hidden
                    className="w-12 shrink-0 self-start pt-1 font-display text-3xl font-light leading-none text-gold/40 transition-colors duration-300 group-hover:text-gold"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 transition-transform duration-300 ease-out group-hover:translate-x-1.5">
                    <h2 className="mb-1.5 font-display text-2xl font-light text-ivory transition-colors group-hover:text-gold-lt">
                      {r.name}
                    </h2>
                    <p className="text-sm leading-relaxed text-silver md:text-base">{r.desc}</p>
                  </div>
                  <span
                    aria-hidden
                    className="self-start pt-1 text-xl text-gold opacity-70 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  >
                    ↗
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}
