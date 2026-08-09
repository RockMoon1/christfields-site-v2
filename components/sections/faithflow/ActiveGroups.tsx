import { Container } from '../../Container';
import { Reveal } from '../../Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { CardSpotlight } from '../../motion/CardSpotlight';
import { MorphBlob } from '../../motion/MorphBlob';

/**
 * The Community: Iron and Ember is the main FaithFlow community everyone
 * joins; leader-led small groups form within it (restructure, 2026-08-09).
 * The card keeps the family's full treatment — glass surface with a gold
 * hairline, a clip-path unveil entrance (the card is revealed, not faded),
 * and a cursor spotlight.
 */
export function ActiveGroups() {
  return (
    <section id="groups" className="relative z-[2] overflow-hidden bg-black-2 py-[110px]">
      {/* Ambient morphing blobs for depth */}
      <MorphBlob color="rgba(201, 165, 72, 0.04)" size={520} className="-right-32 top-16" />
      <MorphBlob color="rgba(45, 106, 79, 0.06)" size={460} className="-bottom-24 -left-24" />
      <Container>
        <SectionHeader
          align="left"
          eyebrow="The Community"
          title={
            <>
              Walking <em className="not-italic text-gold-lt">Together.</em>
            </>
          }
          titleClassName="text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.1]"
          lede="FaithFlow is alive in real people meeting in real places. One community, Iron and Ember, with small groups forming within it, all rooted in the same principles."
          ledeClassName="text-silver"
          className="mb-14"
        />

        <Reveal variant="clip">
          <CardSpotlight className="max-w-3xl rounded-sm" size={420} intensity={0.14}>
          <article className="cf-glass group relative overflow-hidden rounded-sm p-10 transition-transform duration-300 hover:-translate-y-1">
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
                  Colorado · The FaithFlow Community
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-lt/40 bg-emerald-lt/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-bright">
                <span className="inline-block h-1.5 w-1.5 animate-[ffPulse_2s_ease-in-out_infinite] rounded-full bg-emerald-lt shadow-[0_0_8px_var(--color-emerald-lt)]" />
                Active
              </span>
            </header>

            <p className="mb-6 text-base leading-relaxed text-ivory-dim">
              Iron and Ember is the FaithFlow community. Everyone who joins FaithFlow becomes part
              of it: real people meeting in person in Colorado, walking through faith, discipline,
              and community together, rooted in Proverbs 27:17,{' '}
              <em className="text-gold-lt">
                &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
              </em>{' '}
              Together we gather for the big things, shared events, trips, and life side by side.
              Within the community, small groups meet under leaders who know their people.
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
              Joining FaithFlow means joining Iron and Ember. Membership is in person and begins
              with a real conversation. If that is what you are looking for, reach out below.
            </p>
          </article>
          </CardSpotlight>
        </Reveal>
      </Container>
    </section>
  );
}
