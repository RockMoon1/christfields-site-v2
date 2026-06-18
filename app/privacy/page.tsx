import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Christ Fields collects, uses, and protects your information across the Christ Fields website, GraceFlow, LearnFlow, FaithFlow, and ScholarFlow.',
  openGraph: {
    title: 'Privacy Policy by Christ Fields',
    description: 'What we collect, why, who we share it with, and the rights you have.',
    url: 'https://christfields2717.com/privacy',
  },
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/journal', label: 'Journal' },
  { href: '/#join', label: 'Join the Journey', cta: true },
];

const EFFECTIVE = 'June 17, 2026';

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
 * Christ Fields privacy policy. One canonical policy covering every property
 * (this site, GraceFlow, LearnFlow, FaithFlow, ScholarFlow). Written to match
 * what the apps actually collect: account data via Clerk, content stored in
 * Supabase, payments via Stripe, requested emails via Resend, the scripture
 * AI via NVIDIA, hosting via Netlify, and on-device storage in GraceFlow.
 */
export default function PrivacyPage() {
  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="relative">
        <article className="mx-auto max-w-3xl px-7 pb-24 pt-[calc(var(--nav-h)+44px)]">
          <p className="mb-3 font-display text-xs font-medium uppercase tracking-[0.24em] text-gold">
            Christ Fields
          </p>
          <h1 className="mb-3 font-display text-[clamp(2.4rem,6vw,3.6rem)] font-light leading-[1.05] text-ivory">
            Privacy Policy
          </h1>
          <p className="text-sm text-silver">Effective {EFFECTIVE}</p>

          <div className="mt-8 rounded-xl border border-border-gold bg-black-3 p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
              The short version
            </p>
            <P>
              We collect only what we need to bring you Scripture and run the apps you choose to use.
              In GraceFlow, most of your activity stays on your own device. We never sell your
              information, we run no advertising trackers, and your faith and reflections belong to
              you. This page explains exactly what we gather, why, who helps us run the service, and
              the rights you have over your data.
            </P>
          </div>

          <H>1. Who we are</H>
          <P>
            Christ Fields (&ldquo;Christ Fields,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a
            Christian technology company based in Colorado, United States. This policy covers the
            Christ Fields website (christfields2717.com), the GraceFlow app, the LearnFlow study
            tier, the FaithFlow community framework, and ScholarFlow. If you have any question about
            your privacy, write to us any time at{' '}
            <a href="mailto:proverbs@christfields2717.com" className="text-gold-lt underline">
              proverbs@christfields2717.com
            </a>
            .
          </P>

          <H>2. The information we collect</H>
          <P>
            <strong className="text-ivory">Information you give us.</strong> When you create an
            account we collect your name, email address, and (if you sign in with a provider) your
            profile photo. When you fill out a form on our site we collect your name, email, and the
            message you send. When you subscribe to GraceFlow+ or LearnFlow, your payment is handled
            by Stripe; we receive your subscription status, never your full card number.
          </P>
          <P>
            <strong className="text-ivory">Content you create.</strong> Depending on the features you
            use, this can include journal entries, mood check-ins, prayer requests, memory verses,
            progress scores, reading progress, and anything you type into the scripture AI companion.
            Because this content can reveal your religious beliefs and your wellbeing, we treat it as
            sensitive and use it only to provide the service to you, with your consent.
          </P>
          <P>
            <strong className="text-ivory">Information collected automatically.</strong> Like almost
            every website, our servers record technical data such as your IP address, browser and
            device type, and timestamps. We use this to deliver the site, keep it secure, and limit
            abuse (for example, rate-limiting form submissions). We do not use it to build
            advertising profiles.
          </P>
          <P>
            <strong className="text-ivory">On your device (GraceFlow).</strong> When you use GraceFlow
            without an account, your journal, streaks, and progress are saved in your browser&rsquo;s
            local storage and stay on your device. They are not sent to us unless you create an
            account and turn on cloud sync. You can clear them any time from your browser.
          </P>

          <H>3. How we use your information</H>
          <UL>
            <li>To provide and operate the apps and features you choose to use.</li>
            <li>To sync your content across your devices when you sign in.</li>
            <li>To process subscriptions through Stripe.</li>
            <li>To send you the emails you ask for (a reply to your message, a welcome note).</li>
            <li>To generate a Scripture response when you use the AI companion.</li>
            <li>To keep the service secure, prevent abuse, and fix problems.</li>
            <li>To meet our legal obligations.</li>
          </UL>
          <P>
            Where the law requires it, our basis for handling sensitive faith and wellbeing content
            is your consent. You can withdraw that consent at any time by closing your account or
            writing to us.
          </P>

          <H>4. The AI companion</H>
          <P>
            When you type into the Scripture companion in GraceFlow, the
            text you enter is sent to NVIDIA to generate a Scripture-grounded response. Please do not
            enter information you would not want processed by a third party, such as other
            people&rsquo;s full names, or financial or medical details. We do not sell what you type,
            and we do not use it to train our own models. NVIDIA processes it under NVIDIA&rsquo;s own
            terms. A daily limit applies to keep the feature free and available to everyone.
          </P>

          <H>5. Who we share information with</H>
          <P>
            We do not sell your personal information, and we do not share it with advertising
            networks. We use a small set of trusted service providers to run Christ Fields. Each
            handles only what it needs to:
          </P>
          <UL>
            <li><strong className="text-ivory">Clerk</strong> &mdash; accounts and sign-in.</li>
            <li><strong className="text-ivory">Supabase</strong> &mdash; secure storage of the content you save.</li>
            <li><strong className="text-ivory">Stripe</strong> &mdash; payment processing for subscriptions.</li>
            <li><strong className="text-ivory">Resend</strong> &mdash; sending the emails you request.</li>
            <li><strong className="text-ivory">NVIDIA</strong> &mdash; the AI model behind the Scripture companion.</li>
            <li><strong className="text-ivory">Netlify</strong> &mdash; website hosting and delivery.</li>
            <li><strong className="text-ivory">GoatCounter</strong> &mdash; optional, cookieless, privacy-friendly visit counting, only if we enable it.</li>
          </UL>
          <P>
            <strong className="text-ivory">FaithFlow groups.</strong> If you join a FaithFlow group,
            your group leader can see your overall trends (such as the direction of your mood, your
            rhythm consistency, and areas that may need encouragement) and anything you explicitly
            choose to share, like a shared prayer request. Your leader never sees your private journal
            entries, your gratitude or examen notes, your mood notes, or any prayer you keep private.
          </P>
          <P>
            We may also disclose information if the law requires it, or to protect the safety and
            rights of people using our services.
          </P>

          <H>6. Cookies and local storage</H>
          <P>
            When you sign in, Clerk sets cookies that are necessary to keep you logged in securely.
            GraceFlow uses your browser&rsquo;s local storage to hold app data on your device. We do
            not use advertising cookies or cross-site tracking. If we ever turn on visit analytics,
            it is GoatCounter, which is cookieless and collects no personal data.
          </P>

          <H>7. Children&rsquo;s privacy</H>
          <P>
            Christ Fields services are intended for people aged 13 and older. They are not directed to
            children under 13, and we do not knowingly collect personal information from anyone under
            13. If you believe a child under 13 has given us personal information, please contact us at{' '}
            <a href="mailto:proverbs@christfields2717.com" className="text-gold-lt underline">
              proverbs@christfields2717.com
            </a>{' '}
            and we will delete it promptly. If a younger child takes part through a church or family
            (for example, a youth group using FaithFlow), they should do so through a parent&rsquo;s or
            leader&rsquo;s account, not their own.
          </P>

          <H>8. How long we keep it</H>
          <P>
            We keep your information for as long as your account is active and as long as we need it to
            provide the service or to meet legal obligations. When you ask us to delete your account or
            your data, we do so, except for the limited records we are required to keep by law.
            On-device GraceFlow data stays until you clear it.
          </P>

          <H>9. How we protect it</H>
          <P>
            We protect your information with encryption in transit (HTTPS/TLS), access controls,
            server-side secret keys that never reach your browser, and a least-privilege approach to
            who and what can read your data. No method of storage or transmission is ever perfectly
            secure, but we work to hold your trust the way the mission deserves.
          </P>

          <H>10. Your rights and choices</H>
          <P>
            Depending on where you live, you have rights over your personal information. Residents of
            Colorado (under the Colorado Privacy Act), California, Virginia, and a growing number of
            other states have the right to access the data we hold about you, correct it, delete it,
            and receive a copy. Because we do not sell data, run targeted advertising, or profile you,
            there is nothing to opt out of on those fronts, but you may still ask us to confirm that.
          </P>
          <P>
            To exercise any right, email{' '}
            <a href="mailto:proverbs@christfields2717.com" className="text-gold-lt underline">
              proverbs@christfields2717.com
            </a>
            . We will respond within the time the law allows (generally up to 45 days). We will never
            treat you differently for exercising your rights.
          </P>

          <H>11. International users</H>
          <P>
            Christ Fields is operated from the United States, and your information is processed in the
            United States. If you use our services from the European Union or the United Kingdom, you
            have rights under the GDPR and UK GDPR, including access, correction, erasure, restriction,
            portability, and objection. Where we handle sensitive faith or wellbeing content, our
            lawful basis is your explicit consent, which you can withdraw at any time.
          </P>

          <H>12. Changes to this policy</H>
          <P>
            As Christ Fields grows, we may update this policy. When we do, we will change the date at
            the top of this page, and for any significant change we will give clearer notice. Please
            check back from time to time.
          </P>

          <H>13. Contact us</H>
          <P>
            Christ Fields &middot; Colorado, United States
            <br />
            <a href="mailto:proverbs@christfields2717.com" className="text-gold-lt underline">
              proverbs@christfields2717.com
            </a>
          </P>

          <p className="mt-14 border-t border-border-sub pt-6 text-center font-display text-base italic text-silver">
            &ldquo;Whatever you do, work at it with all your heart, as working for the Lord.&rdquo;
          </p>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-muted">
            <Link href="/" className="transition-colors hover:text-ivory">
              Return home
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
