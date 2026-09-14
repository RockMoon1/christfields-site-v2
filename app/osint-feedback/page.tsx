import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { Container } from '@/components/Container';
import { OsintFeedbackForm } from '@/components/sections/OsintFeedbackForm';

export const metadata: Metadata = {
  title: 'OSINT Dashboard Feedback',
  description:
    'A focused Christ Fields feedback page for invited OSINT peers reviewing the dashboard with synthetic data.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'OSINT Dashboard Feedback by Christ Fields',
    description: 'Synthetic-data-only feedback for the OSINT dashboard pilot.',
    url: 'https://christfields2717.com/osint-feedback',
  },
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#review', label: 'Review Focus' },
  { href: '#feedback', label: 'Send Feedback', cta: true },
];

const footerColumns = [
  {
    heading: 'Feedback',
    links: [
      { href: '#review', label: 'Review Focus' },
      { href: '#feedback', label: 'Send Feedback' },
      { href: 'mailto:proverbs@christfields2717.com', label: 'proverbs@christfields2717.com' },
    ],
  },
  {
    heading: 'Christ Fields',
    links: [
      { href: '/', label: 'Main Site' },
      { href: '/journal', label: 'Journal' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
];

const reviewPoints = [
  'Can a new reviewer tell what is known, what is guessed, and what still needs verification?',
  'Does the dashboard make repeated or mirrored sources feel less reliable than independent confirmation?',
  'Where would you want stronger language before anyone used this on real missing-person or welfare-check work?',
  'What is missing from the workflow before this should leave synthetic data?',
];

const lanes = [
  { label: 'Use', value: 'Synthetic cases only' },
  { label: 'Send', value: 'Concrete friction and trust notes' },
  { label: 'Avoid', value: 'Real names, records, screenshots, or active cases' },
];

function DemoPanel() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-border-sub bg-black-3 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-border-sub pb-4">
        <div>
          <p className="font-display text-xl font-light text-ivory">River Example</p>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Synthetic review packet</p>
        </div>
        <span className="rounded-sm border border-border-gold bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gold-lt">
          Demo
        </span>
      </div>

      <div className="grid gap-3">
        {[
          ['Lead', 'Forum profile repeats a name but not enough selectors.'],
          ['Source', 'Two posts share wording from the same original article.'],
          ['Review', 'Address listing is old and should not be treated as current.'],
        ].map(([title, detail]) => (
          <div key={title} className="rounded-sm border border-border-sub bg-black-2 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-gold">{title}</p>
            <p className="text-sm leading-relaxed text-ivory-dim">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        {['Known', 'Unclear', 'Do not share'].map((status) => (
          <div key={status} className="rounded-sm border border-border-sub bg-black px-2 py-3 text-silver">
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OsintFeedbackPage() {
  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="relative overflow-hidden">
        <section className="relative pb-20 pt-[calc(var(--nav-h)+56px)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: `
                radial-gradient(ellipse at 16% 16%, rgba(201, 165, 72, 0.12) 0%, transparent 34%),
                radial-gradient(ellipse at 82% 8%, rgba(45, 106, 79, 0.18) 0%, transparent 38%),
                linear-gradient(180deg, rgba(19, 26, 22, 0.86), rgba(6, 9, 8, 1) 74%)
              `,
            }}
          />
          <Container>
            <div className="grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="max-w-[68ch]">
                <h1 className="text-balance font-display text-[clamp(3rem,7vw,6.25rem)] font-light leading-[0.98] text-ivory">
                  OSINT &amp; Trace feedback.
                </h1>
                <p className="mt-7 max-w-[62ch] text-lg leading-relaxed text-ivory-dim">
                  This is the place for invited OSINT peers to review the dashboard as a product,
                  using fictional material only, and send the useful friction back to Christ Fields.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {lanes.map((lane) => (
                    <div key={lane.label} className="rounded-sm border border-border-sub bg-black-3/75 p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-gold">
                        {lane.label}
                      </p>
                      <p className="text-sm leading-snug text-silver">{lane.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#review"
                    className="inline-flex min-h-11 items-center justify-center rounded-sm bg-gold px-5 py-3 text-sm font-medium uppercase tracking-[0.1em] text-black transition-colors duration-200 hover:bg-gold-lt focus-visible:bg-gold-lt"
                  >
                    Review focus
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border-sub px-5 py-3 text-sm font-medium text-ivory-dim transition-colors duration-200 hover:border-border-gold hover:text-ivory"
                  >
                    Back to Christ Fields
                  </Link>
                </div>
              </div>

              <OsintFeedbackForm />
            </div>
          </Container>
        </section>

        <section id="review" className="border-y border-border-sub bg-black-2 py-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
              <div>
                <h2 className="font-display text-display-md font-light text-ivory">What to look for</h2>
                <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-silver">
                  Strong OSINT feedback is usually specific, plain, and a little uncomfortable. The
                  best notes show exactly where a careful reviewer would slow down.
                </p>
                <div className="mt-8">
                  <DemoPanel />
                </div>
              </div>
              <div className="grid gap-3">
                {reviewPoints.map((point) => (
                  <div key={point} className="rounded-sm border border-border-sub bg-black p-5">
                    <p className="text-[15px] leading-relaxed text-ivory-dim">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer columns={footerColumns} />
    </>
  );
}
