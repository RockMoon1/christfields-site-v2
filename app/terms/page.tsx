import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The plain-language terms for using the Christ Fields website, the FaithFlow member dashboard, and the ScholarFlow tools, including subscriptions and refunds.',
  openGraph: {
    title: 'Terms of Service · Christ Fields',
    description: 'What you can expect from us, what we ask of you, and how payments work.',
    url: 'https://christfields2717.com/terms',
  },
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/journal', label: 'Journal' },
  { href: '/#join', label: 'Join the Journey', cta: true },
];

const EFFECTIVE = 'August 10, 2026';

/** Section heading. */
function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 mb-3 font-display text-2xl font-light text-ivory md:text-3xl">{children}</h2>
  );
}

/** Body paragraph. */
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[15px] leading-relaxed text-ivory-dim">{children}</p>;
}

/** Bulleted list. */
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 ml-5 list-disc space-y-2 text-[15px] leading-relaxed text-ivory-dim">{children}</ul>;
}

/**
 * Christ Fields terms of service. Written plainly on purpose, in the same
 * voice as the privacy policy: what we offer, what we ask, how money works,
 * and how either side can walk away. One canonical page covering the site,
 * the FaithFlow member dashboard, and the ScholarFlow tools.
 */
export default function TermsPage() {
  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="relative">
        <article className="mx-auto max-w-3xl px-7 pb-24 pt-[calc(var(--nav-h)+44px)]">
          <p className="mb-3 font-display text-xs font-medium uppercase tracking-[0.24em] text-gold">
            Christ Fields
          </p>
          <h1 className="mb-3 font-display text-[clamp(2.4rem,6vw,3.6rem)] font-light leading-[1.05] text-ivory">
            Terms of Service
          </h1>
          <p className="text-sm text-silver">Effective {EFFECTIVE}</p>

          <div className="mt-8 rounded-xl border border-border-gold bg-black-3 p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
              The short version
            </p>
            <P>
              Use the tools honestly and kindly, and they are yours to use. If you ever pay for
              something and it does not serve you, tell us and we will make it right. Your words
              and reflections belong to you. Either of us can end the relationship at any time.
              This page spells that out properly.
            </P>
          </div>

          <H>1. Who we are, and what these terms cover</H>
          <P>
            Christ Fields (&ldquo;we,&rdquo; &ldquo;us&rdquo;) is a Christian technology company
            based in Colorado, United States. These terms cover the Christ Fields website
            (christfields2717.com), the FaithFlow member dashboard, and the ScholarFlow tools we
            link to, including GraceFlow and its LearnFlow study tier. By using any of them, you
            agree to these terms. How we handle your information is covered separately in our{' '}
            <Link href="/privacy" className="underline transition-colors hover:text-ivory">
              Privacy Policy
            </Link>
            .
          </P>

          <H>2. The season we are in</H>
          <P>
            We are building slowly and openly. Some tools are free, some offer paid tiers, and
            features change as we learn. We will always be honest on the site about what is open,
            what is invite-only, and what is still being built.
          </P>

          <H>3. Accounts and the member dashboard</H>
          <P>
            The FaithFlow member dashboard is invite-only. Accounts are personal: keep your
            sign-in to yourself, and tell us if you think someone else has used it. Membership in
            the Iron and Ember community and its small groups is handled in person, by real
            people, and a leader or we may remove access where that protects the community.
          </P>

          <H>4. Subscriptions, payments, and refunds</H>
          <UL>
            <li>
              Paid tiers (such as GraceFlow+ and LearnFlow) are billed through Stripe. We never
              see or store your card details.
            </li>
            <li>
              You can cancel any subscription at any time, and you keep access until the end of
              the period you paid for.
            </li>
            <li>
              If a charge was a mistake, or a paid tool genuinely did not serve you, email us
              within 14 days of the charge and we will refund it. We would rather return money
              than keep it wrongly.
            </li>
          </UL>

          <H>5. Your content</H>
          <P>
            Prayers, reflections, notes, and anything else you write remain yours. You give us
            only the permission needed to store and show them back to you (and, where you
            explicitly share something, to the people you shared it with). We do not use your
            content for advertising or sell it to anyone.
          </P>

          <H>6. What we ask of you</H>
          <UL>
            <li>Use the tools as a real person, for their real purpose.</li>
            <li>Do not harass, deceive, or harm other members, in the apps or through them.</li>
            <li>
              Do not attempt to break, probe, or overload the services, or access data that is
              not yours.
            </li>
            <li>Honor what is shared with you in confidence inside the community.</li>
          </UL>

          <H>7. What we honestly promise</H>
          <P>
            We build carefully, but the tools are provided as they are, without warranties. They
            are aids for your walk, not a replacement for your local church, your pastors, or
            professional care such as medical or mental-health support. If something is wrong,
            our responsibility to you is limited to what you paid us in the past twelve months;
            where the law does not allow that limit, the law wins.
          </P>

          <H>8. Ending things</H>
          <P>
            You can stop using the tools or delete your account whenever you wish. We can suspend
            or close accounts that break these terms or harm the community, and we will tell you
            why unless the law prevents it. Sections about your content, payments already made,
            and limits of responsibility survive the end of an account.
          </P>

          <H>9. Changes to these terms</H>
          <P>
            If we change these terms in a way that matters, we will update the effective date at
            the top and, for significant changes, say so plainly on the site or by email. Using
            the tools after a change means you accept the new terms.
          </P>

          <H>10. Talk to us</H>
          <P>
            Questions, concerns, or a refund request: email{' '}
            <a
              href="mailto:proverbs@christfields2717.com"
              className="underline transition-colors hover:text-ivory"
            >
              proverbs@christfields2717.com
            </a>
            . A real person reads it and answers personally.
          </P>
        </article>
      </main>
      <Footer />
    </>
  );
}
