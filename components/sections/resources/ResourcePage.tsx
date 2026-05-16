import Link from 'next/link';
import { Container } from '../../Container';
import { Reveal } from '../../Reveal';

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
 * The page sits below the nav, has the standard hero-style header, then a
 * single list of trusted external resources rendered as full-width cards.
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
      <section className="border-b border-border-sub py-[90px]">
        <Container>
          <Reveal>
            <Link
              href="/#projects"
              className="mb-12 inline-flex items-center text-xs font-medium uppercase tracking-[0.16em] text-silver transition-colors hover:text-gold-lt"
            >
              &larr; Back to Projects
            </Link>
          </Reveal>

          <Reveal delay={0.05}>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
              {eyebrow}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mb-6 font-display text-[clamp(2.6rem,5vw,4rem)] font-light leading-[1.05] text-ivory">
              {titleLine1}<br />
              <em className="not-italic text-gold-lt">{titleLine2}</em>
            </h1>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="max-w-2xl text-base leading-relaxed text-silver md:text-lg">
              {description}
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-[80px]">
        <Container>
          <ul className="border-t border-border-sub">
            {resources.map((r, i) => (
              <Reveal key={r.url} delay={0.05 * Math.min(i, 6)} as="li">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-6 border-b border-border-sub py-7 transition-[background,padding] duration-200 hover:bg-gold/[0.04] hover:pl-4"
                >
                  <div className="flex-1">
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
