import Link from 'next/link';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { TiltCard } from '../motion/TiltCard';

interface CtaLink {
  href: string;
  label: string;
  /** If true, renders as the prominent gold-bordered button. Default is a quieter text link. */
  primary?: boolean;
}

interface ProjectCard {
  badge: string;
  badgeTone: 'active' | 'planned' | 'dev';
  icon: string;
  name: string;
  description: string;
  tags: string[];
  ctas?: CtaLink[];
}

const projects: ProjectCard[] = [
  {
    badge: 'First Group Active',
    badgeTone: 'active',
    icon: '✦',
    name: 'FaithFlow',
    description:
      'Real small groups walking together in person. Scripture-rooted accountability, genuine friendship, and mutual growth. Iron and Ember is our first active group. Brotherhood and sisterhood, face to face.',
    tags: ['Community', 'Accountability', 'Spiritual Growth'],
    ctas: [
      { href: '/faithflow', label: 'Visit FaithFlow', primary: true },
      { href: '/faithflow-resources', label: 'Trusted Resources' },
    ],
  },
  {
    badge: 'In Development',
    badgeTone: 'dev',
    icon: '◉',
    name: 'OSINT & Trace',
    description:
      'Using open-source intelligence and cybersecurity to help find missing people. Technical skill put directly in service of others, in collaboration with organizations working toward that same end. Faith expressed through work.',
    tags: ['Cybersecurity', 'OSINT', 'Missing Persons'],
  },
];

const badgeStyles: Record<ProjectCard['badgeTone'], string> = {
  active: 'border-emerald-lt/40 bg-emerald-lt/15 text-emerald-lt',
  planned: 'border-gold/30 bg-gold/10 text-gold',
  dev: 'border-border-sub bg-black-4 text-silver',
};

export function ProjectsGrid() {
  return (
    <section id="projects" className="border-t border-border-sub py-[110px]">
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Also Building
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            The <em className="not-italic text-gold-lt">Ecosystem.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            ScholarFlow is our flagship, but Christ Fields is building more. Each project serves a
            real need, built carefully without rushing.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.name} delay={0.1 + i * 0.05}>
              <TiltCard className="h-full">
              <article className="group relative h-full overflow-hidden rounded-sm border border-border-sub bg-black-2 p-8 transition-[border-color] duration-300 hover:border-border-gold">
                <span
                  className={`mb-4 inline-block rounded-sm border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] ${badgeStyles[project.badgeTone]}`}
                >
                  {project.badge}
                </span>

                <div
                  aria-hidden
                  className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-black-3 text-gold transition-colors group-hover:bg-gold/10"
                >
                  <span className="text-xl">{project.icon}</span>
                </div>

                <h3 className="mb-3 font-display text-3xl font-light text-ivory">{project.name}</h3>

                <p className="mb-6 text-sm leading-relaxed text-ivory-dim">{project.description}</p>

                <div className="mb-6 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm border border-border-sub bg-black-4 px-3 py-1 text-xs tracking-wider text-silver"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {project.ctas && project.ctas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    {project.ctas.map((cta) => (
                      <Link
                        key={cta.href}
                        href={cta.href}
                        className={
                          cta.primary
                            ? 'inline-flex items-center gap-1 rounded-sm border border-gold/45 bg-transparent px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-black'
                            : 'inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-silver transition-colors hover:text-gold-lt'
                        }
                      >
                        {cta.label} &rarr;
                      </Link>
                    ))}
                  </div>
                )}
              </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
