import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { SectionHeader } from '../SectionHeader';
import { Button } from '../Button';
import { DashboardPreview } from './faithflow/DashboardPreview';

/**
 * The member door: invites Iron and Ember members into their dashboard.
 * Lives on /faithflow (moved off the homepage 2026-08-09 so the front page
 * stays simple and FaithFlow's own page holds FaithFlow's things). The
 * preview card is the clickable DashboardPreview: real tabs, local state
 * only, nothing tracked.
 */

const FEATURES = [
  { label: 'Rhythms', note: 'Daily practices, gentle streaks' },
  { label: 'Prayer', note: 'Requests and answered prayers' },
  { label: 'Reflect', note: 'Mood, gratitude, examen' },
  { label: 'Scripture', note: 'Verse of the day and memory' },
];

export function DashboardInvite() {
  return (
    <section id="dashboard" className="relative overflow-hidden bg-black py-[110px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 78% 28%, rgba(201, 165, 72, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 12% 82%, rgba(27, 67, 50, 0.16) 0%, transparent 60%)
          `,
        }}
      />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <SectionHeader
              align="left"
              eyebrow="Your space"
              title={
                <>
                  A daily place to <em className="not-italic text-gold-lt">walk with God.</em>
                </>
              }
              lede="Your dashboard holds the real, ordinary practices of faith. Keep your rhythms, take what is on your heart straight to him, be honest about where you are, and walk alongside others. Built on grace, not pressure."
              className="mb-8"
              ledeClassName="max-w-xl text-lg"
            />

            <Reveal delay={0.15}>
              <ul className="mb-10 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <span>
                      <span className="block text-sm text-ivory">{f.label}</span>
                      <span className="block text-xs text-muted">{f.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-4">
                <Button href="/dashboard/sign-in">Member sign in &rarr;</Button>
                <Button href="#get-involved" variant="ghost">
                  New here? Say hello
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Signing in is for members of Iron and Ember, the FaithFlow community. It is in
                person and invite-only, so if you are new, say hello below rather than here.
              </p>
            </Reveal>
          </div>

          {/* Clickable preview — unveiled, not faded. */}
          <Reveal variant="clip" delay={0.1}>
            <DashboardPreview />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
