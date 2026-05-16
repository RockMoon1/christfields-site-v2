import { Container } from '../../Container';
import { Reveal } from '../../Reveal';

export function ActiveGroups() {
  return (
    <section id="groups" className="relative z-[2] border-t border-border-sub bg-black-2 py-[110px]">
      <Container>
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
            Active Groups
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
            Walking <em className="not-italic text-gold-lt">Together.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-silver md:text-lg">
            FaithFlow is alive in real people meeting in real places. Each group has its own name
            and character, all rooted in the same principles.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <article className="relative max-w-3xl overflow-hidden rounded-sm border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"
            />

            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="mb-1 font-display text-3xl font-light tracking-wide text-ivory">
                  Iron and Ember
                </h3>
                <p className="text-xs uppercase tracking-[0.16em] text-silver">
                  Colorado · Local Community
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-lt/40 bg-emerald-lt/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-lt">
                <span className="inline-block h-1.5 w-1.5 animate-[ffPulse_2s_ease-in-out_infinite] rounded-full bg-emerald-lt shadow-[0_0_8px_var(--color-emerald-lt)]" />
                Active
              </span>
            </header>

            <p className="mb-6 text-base leading-relaxed text-ivory-dim">
              Iron and Ember is the first active FaithFlow group and serves as an early model for
              what future groups may become. A small group of friends meeting in person, walking
              through faith, discipline, and community together, rooted in Proverbs 27:17,{' '}
              <em className="text-gold-lt">
                &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
              </em>
            </p>

            <div className="mb-6 flex flex-wrap gap-2">
              {['Friendship', 'Accountability', 'Scripture', 'Community'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border border-border-sub bg-black-4 px-3 py-1 text-xs tracking-wider text-ivory-dim"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mb-5 flex items-center gap-4 border-t border-border-sub pt-5">
              <span className="text-xs uppercase tracking-[0.16em] text-silver">Rhythm</span>
              <span className="text-sm text-ivory">In-person gatherings and shared life</span>
            </div>

            <p className="text-sm italic text-muted">
              Iron and Ember is not currently open for public enrollment. If you would like to be
              considered for a future group, reach out below.
            </p>
          </article>
        </Reveal>
      </Container>
    </section>
  );
}
