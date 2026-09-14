import { Container } from '../Container';
import { SectionHeader } from '../SectionHeader';
import { Button } from '../Button';
import { DashboardPreview } from './faithflow/DashboardPreview';

/**
 * The member door: invites Iron and Ember members into their dashboard.
 * Lives on /faithflow (moved off the homepage 2026-08-09 so the front page
 * stays simple and FaithFlow's own page holds FaithFlow's things). The
 * preview illustrates the current gathering, RSVP, calendar, and prayer-wall
 * features with sample details and local interactions only.
 */

const FEATURES = [
  { label: 'Gatherings', note: 'What’s next, when, and where' },
  { label: 'Your answer', note: 'In, unsure, or unable to come' },
  { label: 'Your calendar', note: 'Google, Apple, or Outlook' },
  { label: 'Prayer wall', note: 'Share requests and pray together' },
];

export function DashboardInvite() {
  return (
    <section id="dashboard" className="relative bg-black py-section">
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
        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <SectionHeader
              align="left"
              eyebrow="Your space"
              title={
                <>
                  A place to keep <em className="not-italic text-gold-lt">walking together.</em>
                </>
              }
              lede="See what is coming up, let your group know whether you can make it, and carry one another in prayer. A small space for the practical things that help you meet in person."
              className="mb-8"
              ledeClassName="max-w-xl text-lg"
            />

            <ul className="mb-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <span>
                    <span className="block text-sm text-ivory">{f.label}</span>
                    <span className="block text-sm text-silver">{f.note}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-4">
              <Button href="/dashboard/sign-in">Member sign in &rarr;</Button>
              <Button href="#get-involved" variant="ghost">
                New here? Say hello
              </Button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-silver">
              Signing in is for members of Iron and Ember, the FaithFlow community. It is in
              person and invite-only, so if you are new, say hello below rather than here.
            </p>
          </div>

          {/* Utility content is available immediately, without an entrance. */}
          <DashboardPreview />
        </div>
      </Container>
    </section>
  );
}
