import type { Metadata } from 'next';
import Image from 'next/image';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { ReadinessForm } from '@/components/leaders/ReadinessForm';

/**
 * The leader readiness assessment. Deliberately unlisted: it is not in the
 * nav, not in the sitemap, and not indexed. It is a link you send to someone
 * after a conversation has already started, not a thing people stumble into.
 *
 * It comes BEFORE the Leadership Covenant, never instead of it. The covenant
 * is still walked through in person, given at least seven days before signing,
 * and prayed over (Covenant Section 15).
 */

export const metadata: Metadata = {
  title: 'Leader readiness',
  description: 'A conversation before the conversation, for those considering leading a FaithFlow small group.',
  // Unlisted on purpose. Keeps it out of search results and off the sitemap.
  robots: { index: false, follow: false, nocache: true },
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/faithflow', label: 'FaithFlow' },
];

export default function LeaderReadinessPage() {
  return (
    <>
      <Nav links={navLinks} alwaysScrolled />
      <main id="main" className="relative">
        {/* Hero */}
        <section className="relative overflow-hidden pt-[var(--nav-h)]">
          <div className="relative h-56 w-full md:h-80">
            <Image
              src="/assets/leaders/covenant-path.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[var(--color-black-2,#101512)]"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
            />
          </div>

          <div className="mx-auto max-w-2xl px-6 pb-4 pt-10 text-center md:pt-14">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Christ Fields &middot; Iron and Ember
            </p>
            <h1 className="mb-5 font-display text-[clamp(2.4rem,6vw,3.6rem)] font-light leading-[1.05] text-ivory">
              Leader <em className="not-italic text-gold-lt">readiness.</em>
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-silver md:text-base">
              This is not an application and it is not a test you pass. It is the honest
              conversation that comes before the covenant, so that by the time anyone signs
              anything, both of us already know it is the right thing.
            </p>
            <p className="mx-auto mt-5 max-w-xl font-display text-sm italic text-silver">
              &ldquo;Which of you, desiring to build a tower, doesn&rsquo;t first sit down and
              count the cost?&rdquo;
              <span className="mt-1 block text-[10px] uppercase not-italic tracking-[0.16em] text-gold-lt">
                Luke 14:28
              </span>
            </p>
          </div>
        </section>

        <section className="px-6 pb-24 pt-8">
          <ReadinessForm />
        </section>

        {/* What happens next. Said up front so nobody wonders. */}
        <section className="border-t border-border-sub px-6 py-14">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
              What happens with your answers
            </p>
            <ul className="space-y-3 text-sm leading-relaxed text-silver">
              <li>
                A person reads them. Nothing here is scored automatically and nothing is
                decided by a form.
              </li>
              <li>
                They are kept private to the Table, and they are kept. Deciding whether to sit
                down together is the first thing they are for; over time they also help us see
                what actually marked out a good leader, so we ask better questions than these.
                That is the only other thing they are ever used for.
              </li>
              <li>
                One limit on that, said plainly rather than buried: if something you write means
                a child is being harmed, or that you are not safe, we are not free to keep it
                between us, and we would not want to be. Everything else stays with the Table.
              </li>
              <li>
                We keep them for three years, or for as long as you lead here and three years
                after. Ask us to delete yours and we will, whenever you want, and you never have
                to say why.
              </li>
              <li>
                If it goes further, the next step is the Leadership Covenant, walked through in
                person, given to you at least seven days before you sign anything, so you can
                pray about it rather than decide on the spot.
              </li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
